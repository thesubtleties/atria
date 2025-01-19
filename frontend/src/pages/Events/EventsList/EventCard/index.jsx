import { Text, Group } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import styles from './styles/index.module.css';

export const EventCard = ({ event, isOrgView, canEdit }) => {
  const cardColors =
    event.event_type === 'CONFERENCE'
      ? { gradient: '#9c42f5, #6d42f5' }
      : { gradient: '#42b883, #42a5f5' }; // Different gradient for other types

  return (
    <Link
      to={
        isOrgView
          ? `/app/organizations/${event.organization_id}/events/${event.id}`
          : `/app/events/${event.id}`
      }
      className={styles.card}
      style={{
        '--card-gradient': cardColors.gradient,
      }}
    >
      {canEdit && (
        <button
          className={styles.editButton}
          onClick={(e) => {
            e.preventDefault(); // Prevent navigation
            // TODO: Open edit modal
          }}
        >
          <IconEdit size={20} />
        </button>
      )}

      <Group position="apart" mb="md">
        <Text className={styles.title}>{event.title}</Text>
      </Group>

      <Text className={styles.company}>{event.company_name}</Text>

      <Text className={styles.date}>
        {new Date(event.start_date).toLocaleDateString()} -
        {new Date(event.end_date).toLocaleDateString()}
      </Text>
    </Link>
  );
};
