import { Paper, Text, Group, Badge } from '@mantine/core';
import styles from './styles/index.module.css';

export const SessionCard = ({ session }) => {
  const getStatusColor = () => {
    if (session.is_cancelled) return 'red';
    if (session.is_in_progress) return 'green';
    return 'blue';
  };

  return (
    <Paper p="md" withBorder className={styles.card}>
      <Group position="apart" mb="xs">
        <Text weight={500}>{session.title}</Text>
        <Badge>{session.session_type}</Badge>
      </Group>

      <Group spacing="xs" mb="xs">
        <Text size="sm" color="dimmed">
          {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
        </Text>
        <Text size="sm" color="dimmed">
          ({session.formatted_duration})
        </Text>
      </Group>

      {session.description && (
        <Text size="sm" color="dimmed" lineClamp={2}>
          {session.description}
        </Text>
      )}

      <Group position="apart" mt="md">
        <Badge color={getStatusColor()}>{session.status}</Badge>
      </Group>
    </Paper>
  );
};
