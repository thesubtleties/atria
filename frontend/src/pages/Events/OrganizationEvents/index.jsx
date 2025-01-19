// pages/Events/OrganizationEvents/index.jsx
import { useGetEventsQuery } from '@/app/features/events/api';
import { Container, Group, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { EventCard } from '../EventsList/EventCard';
import styles from './styles/index.module.css';

export const OrganizationEvents = () => {
  const navigate = useNavigate();
  const { orgId } = useParams();
  const { data, isLoading } = useGetEventsQuery({ orgId });
  const events = data?.events || [];

  // TODO: Get this from org context/state
  const canCreateEvents = true; // Temporary, should check if admin/owner

  return (
    <Container className={styles.container}>
      {canCreateEvents && (
        <Group position="right" mb="xl">
          <Button
            onClick={() => {
              /* TODO: Open create event modal */
            }}
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
            canEdit={canCreateEvents} // Same permission as create
          />
        ))}
      </div>
    </Container>
  );
};
