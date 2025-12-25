import { useGetEventsQuery } from '@/app/features/events/api';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import { Container, Group, Button, Text, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { EventCard } from '../EventsList/EventCard';
import { EventModal } from '@/shared/components/modals/event/EventModal';
import { MembersList } from '../../Organizations/OrganizationDetails/MemberLIst';
import type { Event } from '@/types/events';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type EventsResponse = {
  events?: Event[];
};

type OrganizationResponse = {
  user_is_admin_or_owner?: boolean;
};

export const OrganizationEvents = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: orgData } = useGetOrganizationQuery(Number(orgId));
  // TODO: Add loading state handling - currently shows empty state while loading
  const { data: eventsData } = useGetEventsQuery({ orgId: Number(orgId) });

  const typedOrgData = orgData as OrganizationResponse | undefined;
  const typedEventsData = eventsData as EventsResponse | undefined;
  const events = typedEventsData?.events || [];
  const canCreateEvents = typedOrgData?.user_is_admin_or_owner || false;

  return (
    <Container className={cn(styles.container)}>
      <div className={cn(styles.eventsSection)}>
        <Title order={1} ta='center' mb='md'>
          Events
        </Title>

        {canCreateEvents && (
          <div className={cn(styles.buttonContainer)}>
            <Button
              onClick={() => setShowCreateModal(true)}
              className={cn(styles.button)}
              variant='default'
            >
              <Group gap='xs'>
                <IconPlus size={16} className={cn(styles.plusIcon)} />
                <span>New Event</span>
              </Group>
            </Button>
          </div>
        )}

        {events.length > 0 ?
          <div className={cn(styles.grid)}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} isOrgView={true} canEdit={canCreateEvents} />
            ))}
          </div>
        : <div className={cn(styles.emptyState)}>
            <Text size='xl' c='dimmed' ta='center'>
              Organization has no events...
            </Text>
          </div>
        }
      </div>

      <MembersList organizationId={orgId as string} />

      <EventModal
        orgId={Number(orgId)}
        opened={showCreateModal}
        allowConferences={true}
        onClose={() => setShowCreateModal(false)}
      />
    </Container>
  );
};
