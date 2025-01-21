// src/pages/Events/EventsList/index.jsx
import { useGetUserEventsQuery } from '@/app/features/users/api';
import { Container, Text } from '@mantine/core';
import { useSelector } from 'react-redux';
import { EventCard } from './EventCard';
import styles from './styles/index.module.css';

export const EventsList = () => {
  const currentUser = useSelector((state) => state.auth.user);

  const { data, isLoading } = useGetUserEventsQuery(
    { userId: currentUser?.id },
    { skip: !currentUser?.id }
  );

  const events = data?.events || [];

  if (isLoading) {
    return (
      <Container className={styles.container}>
        <Text size="xl" color="dimmed" align="center">
          Loading events...
        </Text>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      {events.length > 0 ? (
        <div className={styles.grid}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isOrgView={false}
              canEdit={false}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Text size="xl" color="dimmed" align="center">
            You haven't been invited to any events yet...
          </Text>
        </div>
      )}
    </Container>
  );
};
