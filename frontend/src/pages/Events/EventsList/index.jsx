// src/pages/Events/EventsList/index.jsx
import { useGetUserEventsQuery } from '@/app/features/users/api';
import { Container, Group } from '@mantine/core';
import { EventCard } from './EventCard';
import styles from './styles/index.module.css';

export const EventsList = () => {
  const { data, isLoading } = useGetUserEventsQuery();
  const events = data?.events || [];

  return (
    <Container className={styles.container}>
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
    </Container>
  );
};
