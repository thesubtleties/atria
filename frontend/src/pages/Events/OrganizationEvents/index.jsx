import { useGetEventsQuery } from '@/app/features/events/api';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import { Container, Group, Button, Text, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { EventCard } from '../EventsList/EventCard';
import { EventModal } from '@/shared/components/modals/event/EventModal';
import { MembersList } from '../../Organizations/OrganizationDetails/MemberLIst';
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
      <div className={styles.eventsSection}>
        <Title order={1} align="center" mb="md">
          Events
        </Title>

        {canCreateEvents && (
          <div className={styles.buttonContainer}>
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
          </div>
        )}

        {events.length > 0 ? (
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
        ) : (
          <div className={styles.emptyState}>
            <Text size="xl" color="dimmed" align="center">
              Organization has no events...
            </Text>
          </div>
        )}
      </div>

      <MembersList organizationId={orgId} />

      <EventModal
        orgId={orgId}
        opened={showCreateModal}
        allowConferences={true}
        onClose={() => setShowCreateModal(false)}
      />
    </Container>
  );
};
