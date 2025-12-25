import { Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { SessionCard } from '../SessionCard';
import { SessionCardMobile } from '../SessionCardMobile';
import type { Session } from '@/types';
import styles from './styles/index.module.css';

type SessionListProps = {
  sessions: Session[];
  currentDay: number;
  eventId: number;
};

type SessionWithConflict = Session & { hasConflict: boolean };

export const SessionList = ({ sessions, currentDay }: SessionListProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!sessions || sessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size='lg' c='dimmed'>
          No sessions scheduled for Day {currentDay}
        </Text>
        <Text size='sm' c='dimmed' mt='xs'>
          {`Click "New Session" to add your first session`}
        </Text>
      </div>
    );
  }

  // Sort sessions by start time
  const sortedSessions = [...sessions].sort((a, b) => {
    const timeAParts = a.start_time.split(':').map(Number);
    const timeBParts = b.start_time.split(':').map(Number);
    return (
      (timeAParts[0] ?? 0) * 60 +
      (timeAParts[1] ?? 0) -
      ((timeBParts[0] ?? 0) * 60 + (timeBParts[1] ?? 0))
    );
  });

  // Check for time conflicts
  const sessionsWithConflicts: SessionWithConflict[] = sortedSessions.map((session, index) => {
    const hasConflict = sortedSessions.some((other, otherIndex) => {
      if (index === otherIndex) return false;

      const start1Parts = session.start_time.split(':').map(Number);
      const end1Parts = session.end_time.split(':').map(Number);
      const start2Parts = other.start_time.split(':').map(Number);
      const end2Parts = other.end_time.split(':').map(Number);

      const startMinutes1 = (start1Parts[0] ?? 0) * 60 + (start1Parts[1] ?? 0);
      const endMinutes1 = (end1Parts[0] ?? 0) * 60 + (end1Parts[1] ?? 0);
      const startMinutes2 = (start2Parts[0] ?? 0) * 60 + (start2Parts[1] ?? 0);
      const endMinutes2 = (end2Parts[0] ?? 0) * 60 + (end2Parts[1] ?? 0);

      return startMinutes1 < endMinutes2 && endMinutes1 > startMinutes2;
    });

    return { ...session, hasConflict };
  });

  const CardComponent = isMobile ? SessionCardMobile : SessionCard;

  return (
    <div className={styles.sessionsList}>
      {sessionsWithConflicts.map((session) => (
        <CardComponent key={session.id} session={session} hasConflict={session.hasConflict} />
      ))}
    </div>
  );
};
