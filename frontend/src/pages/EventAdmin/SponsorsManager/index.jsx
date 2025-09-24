import { useState } from 'react';
import { Text } from '@mantine/core';
import { LoadingOverlay } from '../../../shared/components/loading';
import { useParams } from 'react-router-dom';
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

  const {
    data: sponsors = [],
    isLoading,
    error,
    refetch,
  } = useGetSponsorsQuery({
    eventId: parseInt(eventId),
    activeOnly: false,
  });

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
              <Button variant="primary" onClick={refetch}>
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
          sponsors={sponsors}
          onCreateClick={() => setCreateModalOpen(true)}
          onTierManageClick={() => setTierModalOpen(true)}
        />

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          <LoadingOverlay visible={isLoading} />

          <SponsorsList sponsors={sponsors} eventId={parseInt(eventId)} />
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
