// pages/Session/SessionPending/index.jsx
import { Container, Title, Text, Card } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import styles from './styles/index.module.css';

export const SessionPending = () => (
  <div className={styles.pendingSection}>
    <div className={styles.pendingContainer}>
      <IconClock size={48} stroke={1.5} />
      <Title order={2} mt="md">
        Session Coming Soon
      </Title>
      <Text color="dimmed" size="lg" mt="md" maw={500} mx="auto">
        This session is still being set up by the organizers. Please check back
        later.
      </Text>
    </div>
  </div>
);
