import { Title, Text } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

export const SessionPending = () => (
  <div className={cn(styles.pendingSection)}>
    <div className={cn(styles.pendingContainer)}>
      <IconClock size={48} stroke={1.5} />
      <Title order={2} mt='md'>
        Session Coming Soon
      </Title>
      <Text c='dimmed' size='lg' mt='md' maw={500} mx='auto'>
        This session is still being set up by the organizers. Please check back later.
      </Text>
    </div>
  </div>
);
