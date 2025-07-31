import React from 'react';
import { Group, Badge, ActionIcon, Menu } from '@mantine/core';
import { IconDots, IconDownload, IconUpload, IconTags, IconPlus } from '@tabler/icons-react';
import { Button } from '../../../../shared/components/buttons';
import { getGradientBadgeStyles } from '../../../../shared/hooks/useGradientBadge';
import styles from './SponsorsHeader.module.css';

const SponsorsHeader = ({ 
  eventId, 
  sponsors, 
  onCreateClick, 
  onTierManageClick, 
  onExport, 
  onImport 
}) => {
  // Count sponsors by tier and collect tier colors
  const tierCounts = sponsors.reduce((acc, sponsor) => {
    const tierName = sponsor.tier_name || 'No Tier';
    const tierId = sponsor.tier_id;
    const tierColor = sponsor.tier_color; // This comes from the sponsor's computed property
    
    if (!acc[tierName]) {
      acc[tierName] = {
        count: 0,
        tierId: tierId,
        tierOrder: sponsor.tier_order || 999,
        tierColor: tierColor
      };
    }
    
    acc[tierName].count += 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {});

  // Sort tiers by order
  const sortedTiers = Object.entries(tierCounts)
    .filter(([tier]) => tier !== 'total')
    .sort((a, b) => a[1].tierOrder - b[1].tierOrder);

  return (
    <section className={styles.headerSection}>
      <Group justify="space-between" align="flex-start">
        <div>
          <h2 className={styles.pageTitle}>Sponsors Management</h2>
          <div className={styles.badgeGroup}>
            <Badge 
              className={styles.totalBadge} 
              size="lg" 
              radius="sm"
            >
              {tierCounts.total || 0} Total
            </Badge>
            
            {sortedTiers.map(([tierName, tierData]) => {
              const color = tierData.tierColor;
              const badgeStyles = color ? getGradientBadgeStyles(color) : {};
              
              return (
                <Badge 
                  key={tierName} 
                  className={styles.tierBadge} 
                  size="lg" 
                  radius="sm"
                  style={badgeStyles}
                >
                  {tierData.count} {tierName}
                </Badge>
              );
            })}
          </div>
        </div>
        
        <Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon className={styles.actionIcon} variant="subtle" size="lg">
                <IconDots size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown className={styles.menuDropdown}>
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconDownload size={16} />}
                onClick={onExport}
              >
                Export to CSV
              </Menu.Item>
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconUpload size={16} />}
                onClick={onImport}
              >
                Import from CSV
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          
          <Button
            variant="secondary"
            onClick={onTierManageClick}
          >
            <IconTags size={18} />
            Manage Tiers
          </Button>
          
          <Button
            variant="primary"
            onClick={onCreateClick}
          >
            <IconPlus size={18} />
            Add Sponsor
          </Button>
        </Group>
      </Group>
    </section>
  );
};

export default SponsorsHeader;