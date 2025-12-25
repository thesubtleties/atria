import { Table, Group, Text, ActionIcon, UnstyledButton } from '@mantine/core';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { cn } from '@/lib/cn';
import type { EventUser } from '@/types';
import type { EventUserRoleType } from '../schemas/attendeeSchemas';
import AttendeeRow from '../AttendeeRow';
import AttendeeCard from '../AttendeeCard';
import styles from './styles.module.css';

type AttendeesListProps = {
  attendees: EventUser[];
  currentUserRole: EventUserRoleType;
  currentUserId: number | undefined;
  adminCount: number;
  eventIcebreakers: string[];
  onUpdateRole: (user: EventUser) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

type SortHeaderProps = {
  field: string;
  children: React.ReactNode;
};

const AttendeesList = ({
  attendees,
  currentUserRole,
  currentUserId,
  adminCount,
  eventIcebreakers,
  onUpdateRole,
  onSort,
  sortBy,
  sortOrder,
}: AttendeesListProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const SortHeader = ({ field, children }: SortHeaderProps) => (
    <UnstyledButton onClick={() => onSort(field)} className={cn(styles.sortHeader)}>
      <Group gap='xs' wrap='nowrap'>
        <Text fw={sortBy === field ? 600 : 400}>{children}</Text>
        {sortBy === field && (
          <ActionIcon size='xs' variant='transparent'>
            {sortOrder === 'asc' ?
              <IconChevronUp size={14} />
            : <IconChevronDown size={14} />}
          </ActionIcon>
        )}
      </Group>
    </UnstyledButton>
  );

  if (attendees.length === 0) {
    return (
      <div className={cn(styles.emptyState)}>
        <Text size='lg' c='dimmed' ta='center'>
          No attendees found
        </Text>
        <Text size='sm' c='dimmed' ta='center' mt='xs'>
          Start by inviting people to your event
        </Text>
      </div>
    );
  }

  // Mobile view - cards
  if (isMobile) {
    return (
      <div className={cn(styles.cardsContainer)}>
        {attendees.map((attendee) => (
          <AttendeeCard
            key={attendee.user_id}
            data={attendee}
            isInvitation={false}
            onUpdateRole={onUpdateRole}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            adminCount={adminCount}
            eventIcebreakers={eventIcebreakers}
            onRefresh={() => {}}
          />
        ))}
      </div>
    );
  }

  // Desktop view - table
  return (
    <div className={cn(styles.tableContainer)}>
      <Table horizontalSpacing='md' verticalSpacing='sm' striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <SortHeader field='name'>Attendee</SortHeader>
            </Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>
              <SortHeader field='role'>Role</SortHeader>
            </Table.Th>
            <Table.Th>
              <SortHeader field='company'>Company</SortHeader>
            </Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>
              <SortHeader field='joinDate'>Joined Event</SortHeader>
            </Table.Th>
            <Table.Th style={{ textAlign: 'center', width: 100 }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {attendees.map((attendee) => (
            <AttendeeRow
              key={attendee.user_id}
              attendee={attendee}
              onUpdateRole={onUpdateRole}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
              adminCount={adminCount}
              eventIcebreakers={eventIcebreakers}
            />
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
};

export default AttendeesList;
