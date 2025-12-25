import { useState } from 'react';
import { Text } from '@mantine/core';
import { LoadingOverlay } from '@/shared/components/loading';
import { useParams } from 'react-router-dom';
import { useGetSponsorsQuery } from '@/app/features/sponsors/api';
import { Button } from '@/shared/components/buttons';
import SponsorsHeader from './SponsorsHeader';
import SponsorsList from './SponsorsList';
import SponsorModal from './SponsorModal';
import TierManagementModal from './TierManagementModal';
import styles from './styles/index.module.css';

const SponsorsManager = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tierModalOpen, setTierModalOpen] = useState(false);

  const numericEventId = eventId ? parseInt(eventId, 10) : 0;

  const {
    data: sponsorsResponse,
    isLoading,
    error,
    refetch,
  } = useGetSponsorsQuery(
    {
      eventId: numericEventId,
      activeOnly: false,
    },
    {
      skip: !eventId,
    },
  );

  // Backend returns array directly
  const sponsors = sponsorsResponse ?? [];

  if (error) {
    return (
      <div className={styles.container ?? ''}>
        <div className={styles.bgShape1 ?? ''} />
        <div className={styles.bgShape2 ?? ''} />

        <div className={styles.contentWrapper ?? ''}>
          <section className={styles.mainContent ?? ''}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Text c='red' size='lg' mb='md'>
                Error loading sponsors:{' '}
                {(
                  error &&
                  typeof error === 'object' &&
                  'data' in error &&
                  error.data &&
                  typeof error.data === 'object' &&
                  'message' in error.data
                ) ?
                  String(error.data.message)
                : 'Unknown error'}
              </Text>
              <Button variant='primary' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container ?? ''}>
      <div className={styles.bgShape1 ?? ''} />
      <div className={styles.bgShape2 ?? ''} />

      <div className={styles.contentWrapper ?? ''}>
        <SponsorsHeader
          sponsors={sponsors}
          onCreateClick={() => setCreateModalOpen(true)}
          onTierManageClick={() => setTierModalOpen(true)}
        />

        <section className={styles.mainContent ?? ''}>
          <LoadingOverlay visible={isLoading ?? false} />

          <SponsorsList sponsors={sponsors} eventId={numericEventId} />
        </section>

        <SponsorModal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          eventId={numericEventId}
          mode='create'
          sponsors={sponsors}
        />

        <TierManagementModal
          opened={tierModalOpen}
          onClose={() => setTierModalOpen(false)}
          eventId={numericEventId}
        />
      </div>
    </div>
  );
};

export default SponsorsManager;
