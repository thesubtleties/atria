// pages/Session/SessionDetails/index.jsx
import { Text, Group, Button, Stack } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { useState } from 'react';
import { EditSessionModal } from '@/shared/components/modals/session/EditSessionModal';
import styles from './styles/index.module.css';

export const SessionDetails = ({ session, canEdit }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Format in 12-hour time with AM/PM
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${formattedMinutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
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
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  };

  return (
    <div className={styles.detailsSection}>
      <div className={styles.detailsContainer}>
        <Group position="apart" mb="xl">
          <Text size="lg" weight={500}>
            Session Details
          </Text>
          {canEdit && (
            <Button
              leftIcon={<IconEdit size={16} />}
              variant="light"
              onClick={() => setShowEditModal(true)}
            >
              Edit Session
            </Button>
          )}
        </Group>

        <Stack spacing="md">
          <div className={styles.detailItem}>
            <Text size="sm" color="dimmed">
              Date (UTC)
            </Text>
            <Text>{formatDate(session.start_time)}</Text>
          </div>

          <div className={styles.detailItem}>
            <Text size="sm" color="dimmed">
              Start Time (UTC)
            </Text>
            <Text>{formatTime(session.start_time)}</Text>
          </div>

          <div className={styles.detailItem}>
            <Text size="sm" color="dimmed">
              End Time (UTC)
            </Text>
            <Text>{formatTime(session.end_time)}</Text>
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
    </div>
  );
};
