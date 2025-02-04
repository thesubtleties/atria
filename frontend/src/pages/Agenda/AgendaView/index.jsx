// src/pages/Agenda/AgendaView/index.jsx
import { useState } from 'react';
import { Title, Group, Button, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { useGetSessionsQuery } from '@/app/features/sessions/api';
import { DaySchedule } from './DaySchedule';
import styles from './styles/index.module.css';

export const AgendaView = () => {
  const { eventId } = useParams();
  const [activeDay, setActiveDay] = useState(1);

  const { data, isLoading, error } = useGetSessionsQuery({
    eventId: Number(eventId),
    dayNumber: activeDay,
    page: 1,
    per_page: 50,
  });

  if (isLoading) {
    return (
      <div className={styles.emptyState}>
        <Text size="lg" color="dimmed">
          Loading schedule...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <Text size="lg" color="dimmed">
          Error loading schedule
        </Text>
      </div>
    );
  }

  const sessions = data?.sessions || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title order={2}>Event Schedule</Title>
        <Group spacing="xs">
          <Button
            variant="subtle"
            color="gray"
            onClick={() => setActiveDay((prev) => Math.max(1, prev - 1))}
            disabled={activeDay === 1}
          >
            Previous Day
          </Button>
          <Button
            variant="subtle"
            color="blue"
            onClick={() => setActiveDay((prev) => prev + 1)}
          >
            Next Day
          </Button>
        </Group>
      </div>

      {sessions.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size="lg" color="dimmed">
            No sessions scheduled for this day
          </Text>
        </div>
      ) : (
        <DaySchedule sessions={sessions} dayNumber={activeDay} />
      )}
    </div>
  );
};
