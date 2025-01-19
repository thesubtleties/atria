// pages/Events/OrganizationEvents/index.jsx
import { useGetEventsQuery } from '@/app/features/events/api';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import { Container, Group, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { EventCard } from '../EventsList/EventCard';
import { EventModal } from '@/shared/components/modals/event/EventModal';
import styles from './styles/index.module.css';

export const OrganizationEvents = () => {
  const { orgId } = useParams();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: orgData } = useGetOrganizationQuery(orgId);
  const { data: eventsData, isLoading } = useGetEventsQuery({ orgId });

  const events = eventsData?.events || [];
  const canCreateEvents = orgData?.user_is_admin_or_owner || false;

  return (
    <Container className={styles.container}>
      {canCreateEvents && (
        <Group position="right" mb="xl">
          <Button
            onClick={() => setShowCreateModal(true)}
            className={styles.button}
            variant="default"
          >
            <Group spacing="xs">
              <IconPlus size={16} className={styles.plusIcon} />
              <span>New Event</span>
            </Group>
          </Button>
        </Group>
      )}

      <div className={styles.grid}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isOrgView={true}
            canEdit={canCreateEvents}
          />
        ))}
      </div>

      <EventModal
        orgId={orgId}
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </Container>
  );
};
