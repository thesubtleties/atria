import { useState } from 'react';
import { Container, Button, Group, Title, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useGetEventQuery } from '@/app/features/events/api';
import { useGetSessionsQuery } from '@/app/features/sessions/api';
import { DateNavigation } from '@/pages/Agenda/DateNavigation';
import { EditSessionModal } from '@/shared/components/modals/session/EditSessionModal';
import { SessionList } from './SessionList';
import styles from './styles/index.module.css';

export const SessionManager = () => {
  const { eventId } = useParams();
  const [currentDay, setCurrentDay] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: event, isLoading: eventLoading } = useGetEventQuery(
    parseInt(eventId),
    {
      skip: !eventId,
    }
  );

  const { data: sessionsData, isLoading: sessionsLoading } = useGetSessionsQuery(
    {
      eventId: parseInt(eventId),
      dayNumber: currentDay,
      per_page: 100, // Load all sessions for the day
    },
    {
      skip: !eventId,
    }
  );

  if (eventLoading || sessionsLoading) {
    return <div>Loading...</div>;
  }

  if (!event?.start_date || !event?.day_count) {
    return <div>Event information not available</div>;
  }

  const sessions = sessionsData?.sessions || [];

  return (
    <Container size="xl" className={styles.container}>
      <Stack spacing="xl" style={{ width: '100%' }}>
        {/* Header with New Session button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Title order={2}>Session Manager</Title>
          <Button
            leftIcon={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            New Session
          </Button>
        </div>

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
      </Stack>
    </Container>
  );
};