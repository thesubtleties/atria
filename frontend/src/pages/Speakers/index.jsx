// pages/Speakers/index.jsx
import { useParams } from 'react-router-dom';
import { Container } from '@mantine/core';
import { useGetEventUsersQuery } from '../../app/features/events/api';
import SpeakersList from './SpeakersList';
import styles from './Speakers.module.css';

export const SpeakersPage = () => {
  const { eventId } = useParams();
  const { data, isLoading } = useGetEventUsersQuery({
    eventId: eventId,
    role: 'SPEAKER',
  });

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading speakers...</p>
      </div>
    );
  }

  // Sort speakers alphabetically by name
  const sortedSpeakers = data?.event_users ? 
    [...data.event_users].sort((a, b) => a.user_name.localeCompare(b.user_name)) 
    : [];

  return (
    <div className={styles.pageContainer}>
      {/* Background shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />
      <div className={styles.bgShape3} />
      
      <Container size="xl" className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Featured Speakers</h1>
          {sortedSpeakers.length > 0 && (
            <p className={styles.pageSubtitle}>
              Meet the experts sharing their knowledge at this event
            </p>
          )}
        </div>
        
        {sortedSpeakers.length > 0 ? (
          <SpeakersList speakers={sortedSpeakers} />
        ) : (
          <div className={styles.emptyState}>
            <p>No speakers have been announced yet.</p>
          </div>
        )}
      </Container>
    </div>
  );
};

export default SpeakersPage;
