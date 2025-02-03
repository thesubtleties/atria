// pages/Session/SessionDetails/index.jsx
import { Text, Group, Button, Stack } from '@mantine/core';
import { IconEdit, IconUserPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { EditSessionModal } from '@/shared/components/modals/session/EditSessionModal';
import { AddEventUserModal } from '@/shared/components/modals/session/AddEventUserModal';
import styles from './styles/index.module.css';

export const SessionDetails = ({ session, canEdit }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

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
      <div className={styles.detailsContainer}>
        <div className={styles.header}>
          <Text size="lg" weight={500}>
            Session Details
          </Text>
          {canEdit && (
            <Group spacing="sm">
              <Button
                leftIcon={<IconUserPlus size={16} />}
                variant="subtle"
                className={styles.editButton}
                onClick={() => setShowAddUserModal(true)}
              >
                Add User
              </Button>
              <Button
                leftIcon={<IconEdit size={16} />}
                variant="subtle"
                className={styles.editButton}
                onClick={() => setShowEditModal(true)}
              >
                Edit Session
              </Button>
            </Group>
          )}
        </div>

        <Stack spacing="md">
          <div className={styles.detailItem}>
            <Text size="sm" color="dimmed">
              Event Day
            </Text>
            <Text>
              Day {session.day_number} - {getSessionDate()}
            </Text>
          </div>

          <div className={styles.detailItem}>
            <Text size="sm" color="dimmed">
              Start Time
            </Text>
            <Text>{formatTime(session.start_time)}</Text>
          </div>

          <div className={styles.detailItem}>
            <Text size="sm" color="dimmed">
              End Time
            </Text>
            <Text>{formatTime(session.end_time)}</Text>
          </div>

          <div className={styles.detailItem}>
            <Text size="sm" color="dimmed">
              Duration
            </Text>
            <Text>{session.formatted_duration}</Text>
          </div>

          <div className={styles.detailItem}>
            <Text size="sm" color="dimmed">
              Session Type
            </Text>
            <Text transform="capitalize">
              {session.session_type.toLowerCase().replace('_', ' ')}
            </Text>
          </div>

          {session.description && (
            <div className={styles.detailItem}>
              <Text size="sm" color="dimmed">
                Description
              </Text>
              <Text>{session.description}</Text>
            </div>
          )}
        </Stack>
      </div>

      <EditSessionModal
        session={session}
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        isEditing={true}
      />

      <AddEventUserModal
        eventId={session.event_id}
        opened={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
      />
    </div>
  );
};
