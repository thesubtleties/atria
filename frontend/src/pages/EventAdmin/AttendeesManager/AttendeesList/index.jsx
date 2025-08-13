import { Table, Group, Text, ActionIcon, UnstyledButton } from '@mantine/core';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import AttendeeRow from '../AttendeeRow';
import styles from './styles.module.css';

const AttendeesList = ({
  attendees,
  currentUserRole,
  currentUserId,
  adminCount,
  onUpdateRole,
  onSort,
  sortBy,
  sortOrder,
}) => {
  const SortHeader = ({ field, children }) => (
    <UnstyledButton
      onClick={() => onSort(field)}
      className={styles.sortHeader}
    >
      <Group gap="xs" wrap="nowrap">
        <Text fw={sortBy === field ? 600 : 400}>{children}</Text>
        {sortBy === field && (
          <ActionIcon size="xs" variant="transparent">
            {sortOrder === 'asc' ? (
              <IconChevronUp size={14} />
            ) : (
              <IconChevronDown size={14} />
            )}
          </ActionIcon>
        )}
      </Group>
    </UnstyledButton>
  );

  if (attendees.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size="lg" c="dimmed" ta="center">
          No attendees found
        </Text>
        <Text size="sm" c="dimmed" ta="center" mt="xs">
          Start by inviting people to your event
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <Table horizontalSpacing="md" verticalSpacing="sm" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <SortHeader field="name">Name</SortHeader>
            </Table.Th>
            <Table.Th>
              <SortHeader field="email">Email</SortHeader>
            </Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>
              <SortHeader field="role">Role</SortHeader>
            </Table.Th>
            <Table.Th>
              <SortHeader field="company">Company</SortHeader>
            </Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>
              <SortHeader field="joinDate">Joined Event</SortHeader>
            </Table.Th>
            <Table.Th width={100} style={{ textAlign: 'center' }}>Actions</Table.Th>
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
            />
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
};

export default AttendeesList;