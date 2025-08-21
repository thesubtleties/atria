import { Table, Group, Text, ActionIcon, UnstyledButton, Select } from '@mantine/core';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import SpeakerRow from '../SpeakerRow';
import SpeakerCard from '../SpeakerCard';
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
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedSpeakers = useMemo(() => {
    return [...speakers].sort((a, b) => {
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
  }, [speakers, sortBy, sortOrder]);

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

  // Mobile: Card layout with sorting dropdown
  if (isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <div className={styles.mobileSortControls}>
          <Select
            label="Sort by"
            value={`${sortBy}-${sortOrder}`}
            onChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            data={[
              { value: 'name-asc', label: 'Name (A-Z)' },
              { value: 'name-desc', label: 'Name (Z-A)' },
              { value: 'title-asc', label: 'Title (A-Z)' },
              { value: 'title-desc', label: 'Title (Z-A)' },
              { value: 'company-asc', label: 'Company (A-Z)' },
              { value: 'company-desc', label: 'Company (Z-A)' },
              { value: 'sessions-desc', label: 'Most Sessions' },
              { value: 'sessions-asc', label: 'Least Sessions' },
            ]}
            className={styles.sortSelect}
          />
        </div>
        <div className={styles.cardList}>
          {sortedSpeakers.map((speaker) => (
            <SpeakerCard
              key={speaker.user_id}
              speaker={speaker}
              onEditSpeaker={onEditSpeaker}
              currentUserRole={currentUserRole}
              organizationId={organizationId}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop: Table layout
  return (
    <div className={styles.tableContainer}>
      <Table horizontalSpacing="md" verticalSpacing="sm" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ minWidth: '200px', maxWidth: '300px' }}>
              <SortHeader field="name">Speaker</SortHeader>
            </Table.Th>
            <Table.Th style={{ minWidth: '150px' }}>
              <SortHeader field="title">Title</SortHeader>
            </Table.Th>
            <Table.Th style={{ minWidth: '120px' }}>
              <SortHeader field="company">Company</SortHeader>
            </Table.Th>
            <Table.Th style={{ textAlign: 'center', width: '100px' }}>
              <SortHeader field="sessions">Sessions</SortHeader>
            </Table.Th>
            <Table.Th style={{ minWidth: '150px' }}>Bio</Table.Th>
            <Table.Th width={80} style={{ textAlign: 'center' }}>Actions</Table.Th>
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