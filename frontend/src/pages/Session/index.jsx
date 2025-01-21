import { Container, LoadingOverlay, Alert } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetSessionQuery,
  useUpdateSessionStatusMutation,
  useUpdateSessionMutation,
} from '@/app/features/sessions/api';
import { useGetEventQuery } from '@/app/features/events/api';
import { SessionDisplay } from './SessionDisplay';
import { SessionSpeakers } from './SessionSpeakers';
import { SessionDetails } from './SessionDetails';
import styles from './styles/index.module.css';

export const SessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { data: session, isLoading } = useGetSessionQuery(sessionId);
  const { data: event } = useGetEventQuery(session?.event_id, {
    skip: !session?.event_id,
  });
  const [updateStatus] = useUpdateSessionStatusMutation();
  const [updateSession] = useUpdateSessionMutation();

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (!session) {
    return (
      <Alert color="red" title="Error">
        Session not found
      </Alert>
    );
  }

  // Get canEdit from event data
  const canEdit = event?.organizers?.some((org) =>
    ['ADMIN', 'ORGANIZER'].includes(org.role)
  );

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus({
        id: sessionId,
        status: newStatus,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleUpdate = async (updates) => {
    try {
      await updateSession({
        id: sessionId,
        ...updates,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  return (
    <Container size="xl" className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <SessionDisplay
          isLive={session.is_live}
          streamUrl={session.stream_url}
          startTime={session.start_time}
          title={session.title}
          status={session.status}
        />

        {/* <SessionSpeakers
          sessionId={sessionId}
          eventId={session.event_id}
          speakers={session.speakers}
          canEdit={canEdit}
        /> */}

        <SessionDetails
          session={session}
          canEdit={canEdit}
          onStatusChange={handleStatusChange}
          onUpdate={handleUpdate}
        />
      </div>
    </Container>
  );
};

export default SessionPage;
