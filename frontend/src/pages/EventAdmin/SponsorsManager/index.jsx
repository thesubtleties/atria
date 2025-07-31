import React, { useState } from 'react';
import { LoadingOverlay, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useGetSponsorsQuery } from '../../../app/features/sponsors/api';
import { Button } from '../../../shared/components/buttons';
import SponsorsHeader from './SponsorsHeader';
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
        <SponsorsHeader
          eventId={parseInt(eventId)}
          sponsors={sponsors}
          onCreateClick={() => setCreateModalOpen(true)}
          onTierManageClick={() => setTierModalOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
        />

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