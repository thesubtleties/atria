import { Text } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { cn } from '@/lib/cn';
import styles from '../styles/index.module.css';

export const EmptyState = () => {
  return (
    <div className={cn(styles.emptyStateContainer)}>
      <div className={cn(styles.emptyState)}>
        <IconCalendar size={64} className={cn(styles.emptyIcon)} stroke={1.5} />
        <Text size='xl' fw={600} className={cn(styles.emptyTitle)}>
          No Events Yet
        </Text>
        <Text size='md' className={cn(styles.emptyText)}>
          {"You haven't been invited to any events."}
        </Text>
        <Text size='md' className={cn(styles.emptyText)}>
          {"When organizations invite you to their events, they'll appear here."}
        </Text>
      </div>
    </div>
  );
};
