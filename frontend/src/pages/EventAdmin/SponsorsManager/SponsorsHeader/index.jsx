import React from 'react';
import { Badge } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconTags, IconPlus } from '@tabler/icons-react';
import { Button } from '../../../../shared/components/buttons';
import { getGradientBadgeStyles } from '../../../../shared/hooks/useGradientBadge';
import styles from './SponsorsHeader.module.css';

const SponsorsHeader = ({ 
  sponsors, 
  onCreateClick, 
  onTierManageClick
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  // Count sponsors by tier and collect tier colors (exclude sponsors without tiers)
  const tierCounts = sponsors.reduce((acc, sponsor) => {
    // Skip sponsors without a tier
    if (!sponsor.tier_id) {
      return acc;
    }
    
    const tierName = sponsor.tier_name;
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
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <h2 className={styles.pageTitle}>Sponsors Management</h2>
          <div className={styles.badgeGroup}>
            {/* First row: Total count */}
            <div className={styles.badgeRow}>
              <Badge 
                className={styles.totalBadge} 
                size={isMobile ? 'md' : 'lg'} 
                radius="sm"
              >
                {tierCounts.total || 0} Total
              </Badge>
            </div>
            
            {/* Second row: Tier breakdowns */}
            {sortedTiers.length > 0 && (
              <div className={styles.badgeRow}>
                {sortedTiers.map(([tierName, tierData]) => {
                  const color = tierData.tierColor;
                  const badgeStyles = color ? getGradientBadgeStyles(color) : {};
                  
                  return (
                    <Badge 
                      key={tierName} 
                      className={styles.tierBadge} 
                      size={isMobile ? 'md' : 'lg'} 
                      radius="sm"
                      style={badgeStyles}
                    >
                      {tierData.count} {tierName}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.headerRight}>
          {/* CSV Import/Export - Commented out for post-launch implementation
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
          */}
          
          {!isMobile && (
            <Button
              variant="secondary"
              onClick={onTierManageClick}
            >
              <IconTags size={18} />
              Manage Tiers
            </Button>
          )}
          
          <Button
            variant="primary"
            onClick={onCreateClick}
          >
            <IconPlus size={18} />
            Add Sponsor
          </Button>
          
          {isMobile && (
            <Button
              variant="secondary"
              onClick={onTierManageClick}
              size="sm"
            >
              <IconTags size={18} />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SponsorsHeader;