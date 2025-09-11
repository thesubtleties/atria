import { Stack, ScrollArea, Text, Box } from '@mantine/core';
import { memo } from 'react';
import { IconHeart } from '@tabler/icons-react';
import styles from './EventNav.module.css';
import { EventLinks } from './components/EventLinks';
import { AdminSection } from './components/AdminSection';

const EventNavComponent = ({ eventId, event, isAdmin, onMobileNavClick }) => {
  return (
    <div className={styles.navWrapper}>
      <ScrollArea className={styles.container}>
        <Stack gap={0}>
          <div className={styles.header}>
            <Text size="sm" fw={500} mb="xs">
              Event Menu
            </Text>
          </div>
          <EventLinks eventId={eventId} event={event} onMobileNavClick={onMobileNavClick} />
          {isAdmin && <AdminSection eventId={eventId} onMobileNavClick={onMobileNavClick} />}
        </Stack>
      </ScrollArea>
      
      <Box className={styles.attribution}>
        <Text size="xs">
          <a 
            href="https://atria.gg" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            atria
          </a>
          {' '}is made with{' '}
          <IconHeart size={14} className={styles.heartIcon} stroke={2} />{' '}
          by{' '}
          <a 
            href="https://sbtl.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            sbtl
          </a>
        </Text>
      </Box>
    </div>
  );
};

export const EventNav = memo(EventNavComponent);
EventNav.displayName = 'EventNav';
