// pages/Session/SetupSession/index.jsx
import { Container, Title, Text, Button, Card, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetEventQuery } from '@/app/features/events/api';
import { EditSessionModal } from '@/shared/components/modals/session/EditSessionModal';
import styles from './styles/index.module.css';

export const SetupSession = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { data: event } = useGetEventQuery(eventId);

  // Redirect if user doesn't have permission
  const isOrganizerOrAdmin = event?.organizers?.some((org) =>
    ['ADMIN', 'ORGANIZER'].includes(org.role)
  );

  if (event && !isOrganizerOrAdmin) {
    navigate(
      `/app/organizations/${event.organization_id}/events/${eventId}/session-pending`
    );
    return null;
  }

  return (
    <div className={styles.setupSection}>
      <div className={styles.setupContainer}>
        <Stack align="center" spacing="xl">
          <Title order={2}>Setup Required</Title>

          <Text color="dimmed" size="lg" align="center" mx="auto" maw={600}>
            This event needs a session to be configured before it can be viewed
            by attendees. Click below to set up the session details.
          </Text>

          <Button
            size="lg"
            leftIcon={<IconPlus size={20} />}
            onClick={() => setShowModal(true)}
          >
            Create Session
          </Button>
        </Stack>
      </div>

      <EditSessionModal
        eventId={eventId}
        opened={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(sessionId) => {
          // After successful creation, navigate to the session page
          navigate(
            `/app/organizations/${event.organization_id}/events/${eventId}/sessions/${sessionId}`
          );
        }}
      />
    </div>
  );
};
