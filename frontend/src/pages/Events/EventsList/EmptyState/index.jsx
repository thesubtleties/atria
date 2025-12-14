import { Text } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import styles from '../styles/index.module.css';

export const EmptyState = () => {
  return (
    <div className={styles.emptyStateContainer}>
      <div className={styles.emptyState}>
        <IconCalendar size={64} className={styles.emptyIcon} stroke={1.5} />
        <Text size='xl' weight={600} className={styles.emptyTitle}>
          No Events Yet
        </Text>
        <Text size='md' className={styles.emptyText}>
          {"You haven't been invited to any events."}
        </Text>
        <Text size='md' className={styles.emptyText}>
          {"When organizations invite you to their events, they'll appear here."}
        </Text>
      </div>
    </div>
  );
};
