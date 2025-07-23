import { Stack, ScrollArea, Text } from '@mantine/core';
import { memo } from 'react';
import styles from './EventNav.module.css';
import { EventLinks } from './components/EventLinks';
import { AdminSection } from './components/AdminSection';

const EventNavComponent = ({ eventId, isAdmin }) => {
  return (
    <ScrollArea className={styles.container}>
      <Stack gap={0}>
        <div className={styles.header}>
          <Text size="sm" fw={500} mb="xs">
            Event Menu
          </Text>
        </div>
        <EventLinks eventId={eventId} />
        {isAdmin && <AdminSection eventId={eventId} />}
      </Stack>
    </ScrollArea>
  );
};

export const EventNav = memo(EventNavComponent);
EventNav.displayName = 'EventNav';
