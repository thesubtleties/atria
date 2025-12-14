import { Badge } from '@mantine/core';
import { IconCalendar, IconPlus } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons';
import styles from './styles/index.module.css';

export const SessionManagerHeader = ({ currentDay, sessionStats, onCreateClick }) => {
  return (
    <section className={styles.headerSection}>
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <h2 className={styles.pageTitle}>Session Manager</h2>
          <div className={styles.badgeGroup}>
            {/* First row: Day indicator */}
            <div className={styles.badgeRow}>
              <Badge
                size='lg'
                variant='light'
                color='blue'
                radius='sm'
                leftSection={<IconCalendar size={14} />}
              >
                Day {currentDay}
              </Badge>
            </div>
            {/* Second row: Stats */}
            <div className={styles.badgeRow}>
              <Badge className={styles.statsBadge} size='lg' radius='sm'>
                {sessionStats.total} Total
              </Badge>
              {sessionStats.speakers > 0 && (
                <Badge size='lg' variant='light' color='grape' radius='sm'>
                  {sessionStats.speakers} Speakers
                </Badge>
              )}
              {sessionStats.overlapping > 0 && (
                <Badge
                  size='lg'
                  variant='light'
                  color='yellow'
                  radius='sm'
                  className={styles.warningBadge}
                >
                  {sessionStats.overlapping} Overlapping
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <Button variant='primary' onClick={onCreateClick} className={styles.addButton}>
            <IconPlus size={16} />
            New Session
          </Button>
        </div>
      </div>
    </section>
  );
};
