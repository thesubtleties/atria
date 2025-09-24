import { useState } from 'react';
import { LoadingOverlay } from '../../../shared/components/loading';
import { useParams } from 'react-router-dom';
// import { notifications } from '@mantine/notifications'; // For future export/import
import { useGetEventQuery } from '@/app/features/events/api';
import { useGetSessionsQuery } from '@/app/features/sessions/api';
import { DateNavigation } from '@/pages/Agenda/DateNavigation';
import { EditSessionModal } from '@/shared/components/modals/session/EditSessionModal';
import { SessionList } from './SessionList';
import { SessionManagerHeader } from './SessionManagerHeader';
import { SessionErrorState } from './SessionErrorState';
import { SessionEmptyState } from './SessionEmptyState';
import styles from './styles/index.module.css';

export const SessionManager = () => {
  const { eventId } = useParams();
  const [currentDay, setCurrentDay] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: event,
    isLoading: eventLoading,
    error: eventError,
    refetch: refetchEvent,
  } = useGetEventQuery(parseInt(eventId), {
    skip: !eventId,
  });

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
  } = useGetSessionsQuery(
    {
      eventId: parseInt(eventId),
      dayNumber: currentDay,
      per_page: 100, // Load all sessions for the day
    },
    {
      skip: !eventId,
    }
  );

  const sessions = sessionsData?.sessions || [];

  // Calculate session stats
  const sessionStats = sessions.reduce(
    (acc, session) => {
      acc.total = (acc.total || 0) + 1;

      // Count sessions with overlaps
      const hasOverlap = sessions.some((other) => {
        if (session.id === other.id) return false;

        const start1 = session.start_time.split(':').map(Number);
        const end1 = session.end_time.split(':').map(Number);
        const start2 = other.start_time.split(':').map(Number);
        const end2 = other.end_time.split(':').map(Number);

        const startMinutes1 = start1[0] * 60 + start1[1];
        const endMinutes1 = end1[0] * 60 + end1[1];
        const startMinutes2 = start2[0] * 60 + start2[1];
        const endMinutes2 = end2[0] * 60 + end2[1];

        return startMinutes1 < endMinutes2 && endMinutes1 > startMinutes2;
      });

      if (hasOverlap) {
        acc.overlapping = (acc.overlapping || 0) + 1;
      }

      // Count unique speakers
      const speakers = new Set();
      sessions.forEach((s) => {
        if (s.speakers) {
          s.speakers.forEach((speaker) => speakers.add(speaker.user_id));
        }
      });
      acc.speakers = speakers.size;

      return acc;
    },
    { total: 0, overlapping: 0, speakers: 0 }
  );

  // TODO: Implement export/import functionality
  // const handleExport = () => {
  //   notifications.show({
  //     title: 'Export Started',
  //     message: 'Preparing sessions list for download...',
  //     color: 'blue',
  //   });
  // };

  // const handleImport = () => {
  //   notifications.show({
  //     title: 'Import',
  //     message: 'CSV import feature coming soon',
  //     color: 'yellow',
  //   });
  // };

  if (eventError) {
    return <SessionErrorState error={eventError} onRetry={refetchEvent} />;
  }

  if (!event?.start_date || !event?.day_count) {
    return <SessionEmptyState />;
  }

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <SessionManagerHeader
          currentDay={currentDay}
          sessionStats={sessionStats}
          onCreateClick={() => setShowCreateModal(true)}
        />

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          <LoadingOverlay visible={eventLoading || sessionsLoading} />

          {/* Date Navigation */}
          <DateNavigation
            startDate={event.start_date}
            dayCount={event.day_count}
            currentDay={currentDay}
            onDateChange={setCurrentDay}
          />

          {/* Sessions List */}
          <SessionList
            sessions={sessions}
            currentDay={currentDay}
            eventId={eventId}
          />
        </section>

        {/* Create Session Modal */}
        <EditSessionModal
          eventId={parseInt(eventId)}
          opened={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          isEditing={false}
          onSuccess={() => {
            setShowCreateModal(false);
            // Sessions will refresh automatically via RTK Query invalidation
          }}
        />
      </div>
    </div>
  );
};
