import { Title, Text, Button, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetEventQuery } from '@/app/features/events/api';
import { EditSessionModal } from '@/shared/components/modals/session/EditSessionModal';
import type { EventDetail } from '@/types/events';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type Organizer = {
  id: number;
  role: string;
};

export const SetupSession = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { data: event } = useGetEventQuery({ id: Number(eventId) }, { skip: !eventId });

  const typedEvent = event as EventDetail | undefined;

  // Redirect if user doesn't have permission
  const isOrganizerOrAdmin = typedEvent?.organizers?.some((org: Organizer) =>
    ['ADMIN', 'ORGANIZER'].includes(org.role),
  );

  if (typedEvent && !isOrganizerOrAdmin) {
    navigate(`/app/organizations/${typedEvent.organization_id}/events/${eventId}/session-pending`, {
      replace: true,
    });
    return null;
  }

  return (
    <div className={cn(styles.setupSection)}>
      <div className={cn(styles.setupContainer)}>
        <Stack align='center' gap='xl'>
          <Title order={2}>Setup Required</Title>

          <Text c='dimmed' size='lg' ta='center' mx='auto' maw={600}>
            This event needs a session to be configured before it can be viewed by attendees. Click
            below to set up the session details.
          </Text>

          <Button size='lg' leftSection={<IconPlus size={20} />} onClick={() => setShowModal(true)}>
            Create Session
          </Button>
        </Stack>
      </div>

      <EditSessionModal
        eventId={Number(eventId)}
        opened={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(sessionId: number) => {
          // After successful creation, navigate to the session page
          navigate(
            `/app/organizations/${typedEvent?.organization_id}/events/${eventId}/sessions/${sessionId}`,
            { replace: true },
          );
        }}
      />
    </div>
  );
};
