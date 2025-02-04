import { Text } from '@mantine/core';
import { SessionCard } from '../SessionCard';
import styles from './styles/index.module.css';

export const DaySchedule = ({ sessions, dayNumber }) => {
  return (
    <div className={styles.container}>
      <Text size="lg" weight={500} className={styles.header}>
        Day {dayNumber}
      </Text>
      <div className={styles.sessionsGrid}>
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};
