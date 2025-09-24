import { Badge } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/buttons';
import styles from './styles/index.module.css';

export const EventsSection = ({ events }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) return 'Today';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
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

  const getStatusLabel = (status) => {
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
        <h2 className={styles.sectionTitle}>Upcoming Events</h2>
        <Button 
          variant="secondary"
          onClick={() => navigate('/app/events')}
        >
          View All
        </Button>
      </div>

      {events && events.length > 0 ? (
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
                    {formatDate(event.start_date)} • {event.location || 'Virtual'}
                  </div>
                </div>
                <Badge 
                  color={getStatusColor(event.status)}
                  variant="light"
                  radius="sm"
                  className={styles.responsiveBadge}
                >
                  {getStatusLabel(event.status)}
                </Badge>
              </div>
              <div className={styles.cardMeta}>
                {event.attendee_count} {event.attendee_count === 1 ? 'attendee' : 'attendees'} • {event.organization.name}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>You're not registered for any events yet.</p>
          <Button 
            variant="primary"
            onClick={() => navigate('/app/events')}
          >
            Browse Events
          </Button>
        </div>
      )}
    </section>
  );
};