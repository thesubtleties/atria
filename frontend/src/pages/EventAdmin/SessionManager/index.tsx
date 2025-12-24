import { useState } from 'react';
import { LoadingOverlay } from '@/shared/components/loading';
import { useParams } from 'react-router-dom';
import { useGetEventQuery } from '@/app/features/events/api';
import { useGetSessionsQuery } from '@/app/features/sessions/api';
import { DateNavigation } from '@/pages/Agenda/DateNavigation';
import { EditSessionModal } from '@/shared/components/modals/session/EditSessionModal';
import { SessionList } from './SessionList';
import { SessionManagerHeader } from './SessionManagerHeader';
import { SessionErrorState } from './SessionErrorState';
import { SessionEmptyState } from './SessionEmptyState';
import type { Session } from '@/types';
import styles from './styles/index.module.css';

type SessionStats = {
  total: number;
  overlapping: number;
  speakers: number;
};

export const SessionManager = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [currentDay, setCurrentDay] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const numericEventId = eventId ? parseInt(eventId, 10) : 0;

  const {
    data: event,
    isLoading: eventLoading,
    error: eventError,
    refetch: refetchEvent,
  } = useGetEventQuery({ id: numericEventId }, { skip: !eventId });

  const { data: sessionsData, isLoading: sessionsLoading } = useGetSessionsQuery(
    {
      eventId: numericEventId,
      dayNumber: currentDay,
      per_page: 100,
    },
    {
      skip: !eventId,
    },
  );

  const sessions =
    sessionsData?.sessions ??
    ([] as Array<{
      id: number;
      title: string;
      start_time: string;
      end_time: string;
      session_type?: string;
      speakers?: Array<{ user_id: number }>;
    }>);

  // Calculate session stats
  const sessionStats: SessionStats = sessions.reduce(
    (acc, session) => {
      acc.total += 1;

      // Count sessions with overlaps
      const hasOverlap = sessions.some((other) => {
        if (session.id === other.id) return false;

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

      if (hasOverlap) {
        acc.overlapping += 1;
      }

      // Count unique speakers
      const speakers = new Set<number>();
      sessions.forEach((s) => {
        const sessionSpeakers = (s as { speakers?: { user_id: number }[] }).speakers;
        if (sessionSpeakers) {
          sessionSpeakers.forEach((speaker) => speakers.add(speaker.user_id));
        }
      });
      acc.speakers = speakers.size;

      return acc;
    },
    { total: 0, overlapping: 0, speakers: 0 },
  );

  if (eventError) {
    return <SessionErrorState onRetry={refetchEvent} />;
  }

  if (!event?.start_date || !event?.day_count) {
    return <SessionEmptyState />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        <SessionManagerHeader
          currentDay={currentDay}
          sessionStats={sessionStats}
          onCreateClick={() => setShowCreateModal(true)}
        />

        <section className={styles.mainContent}>
          <LoadingOverlay visible={eventLoading || sessionsLoading} />

          <DateNavigation
            startDate={event.start_date}
            dayCount={event.day_count}
            currentDay={currentDay}
            onDateChange={setCurrentDay}
          />

          <SessionList
            sessions={sessions as Session[]}
            currentDay={currentDay}
            eventId={numericEventId}
          />
        </section>

        <EditSessionModal
          eventId={numericEventId}
          opened={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          isEditing={false}
          onSuccess={() => {
            setShowCreateModal(false);
          }}
        />
      </div>
    </div>
  );
};
