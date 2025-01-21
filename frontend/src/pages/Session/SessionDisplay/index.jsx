// pages/Session/SessionDisplay/index.jsx
import { Card, Title, Badge, Group } from '@mantine/core';
import { VimeoEmbed } from './VimeoEmbed';
import styles from './styles/index.module.css';

export const SessionDisplay = ({ streamUrl, title, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE':
        return 'green';
      case 'UPCOMING':
        return 'blue';
      case 'COMPLETED':
        return 'gray';
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Card className={styles.displayCard}>
      <Group position="apart" mb="md">
        <Title order={2}>{title}</Title>
        <Badge size="lg" variant="filled" color={getStatusColor(status)}>
          {status}
        </Badge>
      </Group>

      <div className={styles.displayContainer}>
        <VimeoEmbed url={streamUrl} />
      </div>
    </Card>
  );
};
