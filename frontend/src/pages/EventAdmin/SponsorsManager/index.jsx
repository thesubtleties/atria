import React, { useState } from 'react';
import { Group, LoadingOverlay, Text, Badge, ActionIcon, Menu } from '@mantine/core';
import { IconPlus, IconDownload, IconUpload, IconDots, IconTags } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useGetSponsorsQuery } from '../../../app/features/sponsors/api';
import { Button } from '../../../shared/components/buttons';
import SponsorsList from './SponsorsList';
import SponsorModal from './SponsorModal';
import TierManagementModal from './TierManagementModal';
import styles from './styles/index.module.css';

const SponsorsManager = () => {
  const { eventId } = useParams();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tierModalOpen, setTierModalOpen] = useState(false);

  const { data: sponsors = [], isLoading, error, refetch } = useGetSponsorsQuery({ 
    eventId: parseInt(eventId), 
    activeOnly: false 
  });

  // Count sponsors by tier
  const tierCounts = sponsors.reduce((acc, sponsor) => {
    const tierName = sponsor.tier_name || 'No Tier';
    acc[tierName] = (acc[tierName] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {});

  const handleExport = () => {
    // TODO: Implement CSV export
    notifications.show({
      title: 'Export Started',
      message: 'Preparing sponsors list for download...',
      color: 'blue',
    });
  };

  const handleImport = () => {
    // TODO: Implement CSV import modal
    notifications.show({
      title: 'Import',
      message: 'CSV import feature coming soon',
      color: 'yellow',
    });
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        
        <div className={styles.contentWrapper}>
          <section className={styles.mainContent}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Text c="red" size="lg" mb="md">
                Error loading sponsors: {error.data?.message || 'Unknown error'}
              </Text>
              <Button 
                variant="primary"
                onClick={refetch}
              >
                Retry
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <section className={styles.headerSection}>
          <Group justify="space-between" align="flex-start">
            <div>
              <h2 className={styles.pageTitle}>Sponsors Management</h2>
              <div className={styles.badgeGroup}>
                <Badge className={styles.statsBadge} size="lg" variant="light" radius="sm">
                  {tierCounts.total || 0} Total
                </Badge>
                {Object.entries(tierCounts).map(([tier, count]) => {
                  if (tier === 'total') return null;
                  return (
                    <Badge key={tier} className={styles.tierBadge} size="lg" variant="light" color="grape" radius="sm">
                      {count} {tier}
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
                    onClick={handleExport}
                  >
                    Export to CSV
                  </Menu.Item>
                  <Menu.Item
                    className={styles.menuItem}
                    leftSection={<IconUpload size={16} />}
                    onClick={handleImport}
                  >
                    Import from CSV
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              <Button
                variant="secondary"
                onClick={() => setTierModalOpen(true)}
              >
                <IconTags size={18} />
                Manage Tiers
              </Button>
              <Button
                variant="primary"
                onClick={() => setCreateModalOpen(true)}
              >
                <IconPlus size={18} />
                Add Sponsor
              </Button>
            </Group>
          </Group>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          <LoadingOverlay visible={isLoading} />
          
          <SponsorsList 
            sponsors={sponsors} 
            eventId={parseInt(eventId)}
          />
        </section>

        <SponsorModal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          eventId={parseInt(eventId)}
          mode="create"
          sponsors={sponsors}
        />

        <TierManagementModal
          opened={tierModalOpen}
          onClose={() => setTierModalOpen(false)}
          eventId={parseInt(eventId)}
        />
      </div>
    </div>
  );
};

export default SponsorsManager;