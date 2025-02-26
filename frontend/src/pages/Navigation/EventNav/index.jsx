import { Stack } from '@mantine/core';
import { memo } from 'react';
import styles from './EventNav.module.css';
import { EventLinks } from './components/EventLinks';
import { AdminSection } from './components/AdminSection';

const EventNavComponent = ({ eventId, isAdmin }) => {
  return (
    <Stack className={styles.container}>
      <EventLinks eventId={eventId} />
      {isAdmin && <AdminSection eventId={eventId} />}
    </Stack>
  );
};

export const EventNav = memo(EventNavComponent);
EventNav.displayName = 'EventNav';
