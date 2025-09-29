import { useParams } from 'react-router-dom';
import { Alert, Container } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import {
  useGetSponsorsQuery,
  useGetSponsorTiersQuery,
} from '../../app/features/sponsors/api';
import { LoadingPage } from '../../shared/components/loading';
import SponsorsList from './SponsorsList';
import styles from './Sponsors.module.css';

export const SponsorsPage = () => {
  const { eventId } = useParams();

  // Debug logging
  console.log('SponsorsPage - eventId from params:', eventId);

  const {
    data: sponsors = [],
    isLoading: sponsorsLoading,
    error: sponsorsError,
  } = useGetSponsorsQuery(
    { eventId },
    {
      skip: !eventId, // Skip query if no eventId
    }
  );

  const {
    data: tiers = [],
    isLoading: tiersLoading,
    error: tiersError,
  } = useGetSponsorTiersQuery(
    { eventId },
    {
      skip: !eventId, // Skip query if no eventId
    }
  );

  const isLoading = sponsorsLoading || tiersLoading;

  // Log errors for debugging
  if (sponsorsError) {
    console.error('Sponsors API Error:', sponsorsError);
    console.error('Failed URL would be:', `/events/${eventId}/sponsors`);
    console.error(
      'Full error details:',
      JSON.stringify(sponsorsError, null, 2)
    );
  }
  if (tiersError) {
    console.error('Sponsor Tiers API Error:', tiersError);
  }

  if (isLoading) {
    return <LoadingPage message="Loading sponsors..." />;
  }

  if (sponsorsError) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <Alert
            icon={<IconInfoCircle size="1rem" />}
            title="Error"
            color="red"
            className={styles.errorAlert}
          >
            Failed to load sponsors. Please try again later.
          </Alert>
        </div>
      </div>
    );
  }

  // Filter to only show active sponsors (handle snake_case from API)
  const activeSponsors = sponsors.filter(
    (sponsor) => sponsor.is_active !== false
  );

  return (
    <div className={styles.pageContainer}>
      {/* Background shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />
      <div className={styles.bgShape3} />

      <Container size="xl" className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Our Sponsors</h1>
          {activeSponsors.length > 0 && (
            <p className={styles.pageSubtitle}>
              Thank you to all our sponsors who make this event possible
            </p>
          )}
        </div>

        <SponsorsList sponsors={activeSponsors} tiers={tiers} />
      </Container>
    </div>
  );
};

export default SponsorsPage;
