import { Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { SessionCard } from '../SessionCard';
import { SessionCardMobile } from '../SessionCardMobile';
import styles from './styles/index.module.css';

export const SessionList = ({ sessions, currentDay, eventId }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (!sessions || sessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size="lg" c="dimmed">
          No sessions scheduled for Day {currentDay}
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          Click "New Session" to add your first session
        </Text>
      </div>
    );
  }

  // Sort sessions by start time
  const sortedSessions = [...sessions].sort((a, b) => {
    const timeA = a.start_time.split(':').map(Number);
    const timeB = b.start_time.split(':').map(Number);
    return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
  });

  // Check for time conflicts
  const sessionsWithConflicts = sortedSessions.map((session, index) => {
    const hasConflict = sortedSessions.some((other, otherIndex) => {
      if (index === otherIndex) return false;
      
      const start1 = session.start_time.split(':').map(Number);
      const end1 = session.end_time.split(':').map(Number);
      const start2 = other.start_time.split(':').map(Number);
      const end2 = other.end_time.split(':').map(Number);
      
      const startMinutes1 = start1[0] * 60 + start1[1];
      const endMinutes1 = end1[0] * 60 + end1[1];
      const startMinutes2 = start2[0] * 60 + start2[1];
      const endMinutes2 = end2[0] * 60 + end2[1];
      
      return (startMinutes1 < endMinutes2 && endMinutes1 > startMinutes2);
    });
    
    return { ...session, hasConflict };
  });

  // Choose the appropriate card component based on viewport
  const CardComponent = isMobile ? SessionCardMobile : SessionCard;
  
  return (
    <div className={styles.sessionsList}>
      {sessionsWithConflicts.map((session) => (
        <CardComponent
          key={session.id}
          session={session}
          eventId={eventId}
          hasConflict={session.hasConflict}
        />
      ))}
    </div>
  );
};