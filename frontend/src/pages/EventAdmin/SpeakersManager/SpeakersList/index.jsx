import { Table, Group, Text, ActionIcon, UnstyledButton, Badge } from '@mantine/core';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import SpeakerRow from '../SpeakerRow';
import { getNameSortValue } from '../../../../shared/utils/sorting';
import styles from './styles.module.css';

const SpeakersList = ({
  speakers,
  currentUserRole,
  onEditSpeaker,
  organizationId,
}) => {
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedSpeakers = [...speakers].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name':
        // Use the new sorting utility for proper last name sorting
        aVal = getNameSortValue(a);
        bVal = getNameSortValue(b);
        break;
      case 'title':
        aVal = a.speaker_title || a.title || '';
        bVal = b.speaker_title || b.title || '';
        break;
      case 'company':
        aVal = a.company_name || '';
        bVal = b.company_name || '';
        break;
      case 'sessions':
        aVal = a.session_count || 0;
        bVal = b.session_count || 0;
        break;
      default:
        // Default to name sorting with last name first
        aVal = getNameSortValue(a);
        bVal = getNameSortValue(b);
    }

    // Use localeCompare for better string comparison, especially for names
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === 'asc' ? comparison : -comparison;
    }

    // Fallback for non-string values (like session counts)
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const SortHeader = ({ field, children }) => (
    <UnstyledButton
      onClick={() => handleSort(field)}
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

  if (speakers.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size="lg" c="dimmed" ta="center">
          No speakers found
        </Text>
        <Text size="sm" c="dimmed" ta="center" mt="xs">
          Add speakers to showcase them at your event
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
              <SortHeader field="name">Speaker</SortHeader>
            </Table.Th>
            <Table.Th>
              <SortHeader field="title">Title</SortHeader>
            </Table.Th>
            <Table.Th>
              <SortHeader field="company">Company</SortHeader>
            </Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>
              <SortHeader field="sessions">Sessions</SortHeader>
            </Table.Th>
            <Table.Th>Bio</Table.Th>
            <Table.Th width={100} style={{ textAlign: 'center' }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sortedSpeakers.map((speaker) => (
            <SpeakerRow
              key={speaker.user_id}
              speaker={speaker}
              onEditSpeaker={onEditSpeaker}
              currentUserRole={currentUserRole}
              organizationId={organizationId}
            />
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
};

export default SpeakersList;