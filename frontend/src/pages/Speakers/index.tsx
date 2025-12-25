import { useParams } from 'react-router-dom';
import { Container } from '@mantine/core';
import { useGetEventUsersQuery } from '@/app/features/events/api';
import { PageHeader } from '@/shared/components/PageHeader';
import SpeakersList from './SpeakersList';
import styles from './Speakers.module.css';

export const SpeakersPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { data, isLoading } = useGetEventUsersQuery({
    eventId: Number(eventId),
    role: 'SPEAKER',
  });

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading speakers...</p>
      </div>
    );
  }

  // Backend already sorts by last name, then first name - no need to re-sort
  const speakers = data?.event_users ?? [];

  return (
    <div className={styles.pageContainer}>
      {/* Background shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />
      <div className={styles.bgShape3} />

      <Container size='xl' className={styles.contentWrapper ?? ''}>
        <PageHeader
          title='Featured Speakers'
          subtitle={
            speakers.length > 0 ? 'Meet the experts sharing their knowledge at this event' : ''
          }
        />

        {speakers.length > 0 ?
          <SpeakersList speakers={speakers} />
        : <div className={styles.emptyState}>
            <p>No speakers have been announced yet.</p>
          </div>
        }
      </Container>
    </div>
  );
};

export default SpeakersPage;
