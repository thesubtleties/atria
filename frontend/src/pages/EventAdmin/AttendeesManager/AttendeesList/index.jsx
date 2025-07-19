import { Table, Checkbox, Group, Text, ActionIcon, UnstyledButton } from '@mantine/core';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import AttendeeRow from '../AttendeeRow';
import styles from './styles.module.css';

const AttendeesList = ({
  attendees,
  currentUserRole,
  selectedUsers,
  onSelectUsers,
  onUpdateRole,
  onSort,
  sortBy,
  sortOrder,
}) => {
  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectUsers(attendees.map((a) => a.user_id));
    } else {
      onSelectUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      onSelectUsers([...selectedUsers, userId]);
    } else {
      onSelectUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  const isAllSelected = attendees.length > 0 && selectedUsers.length === attendees.length;
  const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < attendees.length;

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
            <Table.Th width={40}>
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={(e) => handleSelectAll(e.currentTarget.checked)}
              />
            </Table.Th>
            <Table.Th>
              <SortHeader field="name">Name</SortHeader>
            </Table.Th>
            <Table.Th>
              <SortHeader field="email">Email</SortHeader>
            </Table.Th>
            <Table.Th>
              <SortHeader field="role">Role</SortHeader>
            </Table.Th>
            <Table.Th>
              <SortHeader field="company">Company</SortHeader>
            </Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th>
              <SortHeader field="joinDate">Joined</SortHeader>
            </Table.Th>
            <Table.Th width={100}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {attendees.map((attendee) => (
            <AttendeeRow
              key={attendee.user_id}
              attendee={attendee}
              isSelected={selectedUsers.includes(attendee.user_id)}
              onSelect={(checked) => handleSelectUser(attendee.user_id, checked)}
              onUpdateRole={onUpdateRole}
              currentUserRole={currentUserRole}
            />
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
};

export default AttendeesList;