// pages/Session/SessionDetails/index.jsx
import { Text, Group, Divider, ActionIcon } from '@mantine/core';
import { IconEdit, IconClock, IconCalendar } from '@tabler/icons-react';
import { useState } from 'react';
import { EditSessionModal } from '@/shared/components/modals/session/EditSessionModal';
import styles from './styles/index.module.css';

export const SessionDetails = ({ session, canEdit }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Parse HH:MM:SS format
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    // Convert to 12-hour format
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getSessionDate = () => {
    if (!session.event?.start_date) return '';
    const eventStart = new Date(session.event.start_date);
    const sessionDate = new Date(eventStart);
    sessionDate.setDate(eventStart.getDate() + session.day_number - 1);

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${months[sessionDate.getMonth()]} ${sessionDate.getDate()}, ${sessionDate.getFullYear()}`;
  };

  return (
    <div className={styles.detailsSection}>
      <Group gap="xl" className={styles.detailsGrid}>
        {/* Date */}
        <Group gap="xs" align="center">
          <IconCalendar size={16} stroke={1.5} color="var(--mantine-color-gray-6)" />
          <Text size="sm">{getSessionDate()}</Text>
        </Group>

        <Divider orientation="vertical" />

        {/* Time */}
        <Group gap="xs" align="center">
          <IconClock size={16} stroke={1.5} color="var(--mantine-color-gray-6)" />
          <Text size="sm">
            {formatTime(session.start_time)} - {formatTime(session.end_time)}
          </Text>
          <Text size="xs" c="dimmed">
            ({session.formatted_duration})
          </Text>
        </Group>

        <Divider orientation="vertical" />

        {/* Type */}
        <div className={`${styles.typeTag} ${styles[session.session_type.toLowerCase()]}`}>
          {session.session_type.replace(/_/g, ' ')}
        </div>

        {session.location && (
          <>
            <Divider orientation="vertical" />
            <Group gap="xs">
              <Text size="xs" c="dimmed">Location:</Text>
              <Text size="sm">{session.location}</Text>
            </Group>
          </>
        )}
        
        {canEdit && (
          <>
            <Divider orientation="vertical" />
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => setShowEditModal(true)}
            >
              <IconEdit size={14} />
            </ActionIcon>
          </>
        )}
      </Group>

      <EditSessionModal
        session={session}
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        isEditing={true}
      />
    </div>
  );
};
