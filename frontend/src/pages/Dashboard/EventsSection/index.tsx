import { Badge } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, isSameDay } from 'date-fns';
import { Button } from '@/shared/components/buttons';
import { useFormatDate, parseDateOnly } from '@/shared/hooks/formatDate';
import type { DashboardEvent } from '../index';
import styles from './styles/index.module.css';

type EventsSectionProps = {
  events: DashboardEvent[] | null;
};

export const EventsSection = ({ events }: EventsSectionProps) => {
  const navigate = useNavigate();
  const { formatDateWithToday } = useFormatDate();

  const getEventDateDisplay = (event: DashboardEvent): string => {
    if (!event.start_date) return '';

    try {
      const startDate = parseDateOnly(event.start_date);
      if (!startDate) return formatDateWithToday(event.start_date);

      const endDate = event.end_date ? parseDateOnly(event.end_date) : startDate;
      if (!endDate) return formatDateWithToday(event.start_date);

      // Check if it's a single-day event
      if (isSameDay(startDate, endDate)) {
        return formatDateWithToday(event.start_date);
      }

      // Multi-day event - calculate duration
      const daysDiff = differenceInDays(endDate, startDate) + 1; // +1 to include both start and end day
      return `${formatDateWithToday(event.start_date)} • ${daysDiff} day event`;
    } catch (error) {
      console.error('Error formatting event dates:', error);
      return formatDateWithToday(event.start_date);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'live':
        return 'red';
      case 'upcoming':
        return 'green';
      case 'past':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'live':
        return 'Live';
      case 'upcoming':
        return 'Upcoming';
      case 'past':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Your Events</h2>
        <Button variant='secondary' onClick={() => navigate('/app/events')}>
          View All
        </Button>
      </div>

      {events && events.length > 0 ?
        <div className={styles.cardList}>
          {events.map((event) => (
            <div
              key={event.id}
              className={styles.card}
              onClick={() => navigate(`/app/events/${event.id}`)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardContent}>
                  <div className={styles.cardTitle}>{event.name}</div>
                  <div className={styles.cardSubtitle}>
                    {getEventDateDisplay(event)} • {event.location || 'Virtual'}
                  </div>
                </div>
                <Badge
                  color={getStatusColor(event.status)}
                  variant='light'
                  radius='sm'
                  className={styles.responsiveBadge ?? ''}
                >
                  {getStatusLabel(event.status)}
                </Badge>
              </div>
              <div className={styles.cardMeta}>
                {event.attendee_count} {event.attendee_count === 1 ? 'attendee' : 'attendees'} •{' '}
                {event.organization.name}
              </div>
            </div>
          ))}
        </div>
      : <div className={styles.emptyState}>
          <p>{`You're not registered for any events yet.`}</p>
          <Button variant='primary' onClick={() => navigate('/app/events')}>
            Browse Events
          </Button>
        </div>
      }
    </section>
  );
};
