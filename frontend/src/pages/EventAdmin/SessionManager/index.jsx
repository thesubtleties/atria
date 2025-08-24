import { useState } from 'react';
import { 
  Group, 
  Text, 
  LoadingOverlay, 
  Badge, 
  ActionIcon, 
  Menu 
} from '@mantine/core';
import { 
  IconPlus, 
  IconDots, 
  IconDownload, 
  IconUpload,
  IconCalendar
} from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useGetEventQuery } from '@/app/features/events/api';
import { useGetSessionsQuery } from '@/app/features/sessions/api';
import { DateNavigation } from '@/pages/Agenda/DateNavigation';
import { EditSessionModal } from '@/shared/components/modals/session/EditSessionModal';
import { Button } from '@/shared/components/buttons';
import { SessionList } from './SessionList';
import styles from './styles/index.module.css';

export const SessionManager = () => {
  const { eventId } = useParams();
  const [currentDay, setCurrentDay] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: event, isLoading: eventLoading, error: eventError, refetch: refetchEvent } = useGetEventQuery(
    parseInt(eventId),
    {
      skip: !eventId,
    }
  );

  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useGetSessionsQuery(
    {
      eventId: parseInt(eventId),
      dayNumber: currentDay,
      per_page: 100, // Load all sessions for the day
    },
    {
      skip: !eventId,
    }
  );

  const sessions = sessionsData?.sessions || [];

  // Calculate session stats
  const sessionStats = sessions.reduce((acc, session) => {
    acc.total = (acc.total || 0) + 1;
    
    // Count sessions with overlaps
    const hasOverlap = sessions.some((other) => {
      if (session.id === other.id) return false;
      
      const start1 = session.start_time.split(':').map(Number);
      const end1 = session.end_time.split(':').map(Number);
      const start2 = other.start_time.split(':').map(Number);
      const end2 = other.end_time.split(':').map(Number);
      
      const startMinutes1 = start1[0] * 60 + start1[1];
      const endMinutes1 = end1[0] * 60 + end1[1];
      const startMinutes2 = start2[0] * 60 + start2[1];
      const endMinutes2 = end2[0] * 60 + end2[1];
      
      return (startMinutes1 < endMinutes2 && endMinutes1 > startMinutes2);
    });
    
    if (hasOverlap) {
      acc.overlapping = (acc.overlapping || 0) + 1;
    }
    
    // Count unique speakers
    const speakers = new Set();
    sessions.forEach(s => {
      if (s.speakers) {
        s.speakers.forEach(speaker => speakers.add(speaker.user_id));
      }
    });
    acc.speakers = speakers.size;
    
    return acc;
  }, { total: 0, overlapping: 0, speakers: 0 });

  const handleExport = () => {
    // TODO: Implement CSV export
    notifications.show({
      title: 'Export Started',
      message: 'Preparing sessions list for download...',
      color: 'blue',
    });
  };

  const handleImport = () => {
    // TODO: Implement CSV import
    notifications.show({
      title: 'Import',
      message: 'CSV import feature coming soon',
      color: 'yellow',
    });
  };

  if (eventError) {
    return (
      <div className={styles.container}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        
        <div className={styles.contentWrapper}>
          <section className={styles.mainContent}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Text c="red" size="lg" mb="md">
                Error loading event information
              </Text>
              <Button 
                variant="primary"
                onClick={refetchEvent}
              >
                Retry
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!event?.start_date || !event?.day_count) {
    return (
      <div className={styles.container}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        
        <div className={styles.contentWrapper}>
          <section className={styles.mainContent}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Text size="lg" c="dimmed">
                Event information not available
              </Text>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <section className={styles.headerSection}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <h2 className={styles.pageTitle}>Session Manager</h2>
              <div className={styles.badgeGroup}>
                {/* First row: Day indicator */}
                <div className={styles.badgeRow}>
                  <Badge 
                    size="lg" 
                    variant="light" 
                    color="blue" 
                    radius="sm" 
                    leftSection={<IconCalendar size={14} />}
                  >
                    Day {currentDay}
                  </Badge>
                </div>
                {/* Second row: Stats */}
                <div className={styles.badgeRow}>
                  <Badge className={styles.statsBadge} size="lg" radius="sm">
                    {sessionStats.total} Total
                  </Badge>
                  {sessionStats.speakers > 0 && (
                    <Badge size="lg" variant="light" color="grape" radius="sm">
                      {sessionStats.speakers} Speakers
                    </Badge>
                  )}
                  {sessionStats.overlapping > 0 && (
                    <Badge size="lg" variant="light" color="yellow" radius="sm">
                      {sessionStats.overlapping} Overlapping
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.headerRight}>
              {/* CSV Import/Export - Commented out for post-launch implementation
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon className={styles.actionIcon} variant="subtle" size="lg">
                    <IconDots size={20} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown className={styles.menuDropdown}>
                  <Menu.Item
                    className={styles.menuItem}
                    leftSection={<IconDownload size={16} />}
                    onClick={handleExport}
                  >
                    Export to CSV
                  </Menu.Item>
                  <Menu.Item
                    className={styles.menuItem}
                    leftSection={<IconUpload size={16} />}
                    onClick={handleImport}
                  >
                    Import from CSV
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              */}
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <IconPlus size={18} />
                New Session
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          <LoadingOverlay visible={eventLoading || sessionsLoading} />
          
          {/* Date Navigation */}
          <DateNavigation
            startDate={event.start_date}
            dayCount={event.day_count}
            currentDay={currentDay}
            onDateChange={setCurrentDay}
          />

          {/* Sessions List */}
          <SessionList 
            sessions={sessions} 
            currentDay={currentDay}
            eventId={eventId}
          />
        </section>

        {/* Create Session Modal */}
        <EditSessionModal
          eventId={parseInt(eventId)}
          opened={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          isEditing={false}
          onSuccess={() => {
            setShowCreateModal(false);
            // Sessions will refresh automatically via RTK Query invalidation
          }}
        />
      </div>
    </div>
  );
};