import { Text, Badge } from '@mantine/core';
import { IconCalendar, IconUsers, IconMapPin } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useFormatDate } from '@/shared/hooks/formatDate';
import styles from './styles/index.module.css';

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const { formatDate } = useFormatDate();

  const handleCardClick = () => {
    navigate(`/app/events/${event.id}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'green';
      case 'draft':
        return 'yellow';
      case 'archived':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatEventDates = () => {
    const startDate = formatDate(event.start_date);
    const endDate = formatDate(event.end_date);
    
    if (startDate === endDate) {
      return startDate;
    }
    return `${startDate} - ${endDate}`;
  };

  return (
    <div className={styles.eventCard} onClick={handleCardClick}>
      <div className={styles.cardHeader}>
        <Badge
          variant="unstyled"
          className={styles.statusBadge}
          data-status={event.status?.toLowerCase()}
        >
          {event.status}
        </Badge>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.eventTitle}>{event.title}</h3>
        
        <div className={styles.eventMeta}>
          <div className={styles.metaItem}>
            <IconCalendar size={16} className={styles.metaIcon} />
            <Text size="sm" className={styles.metaText}>
              {formatEventDates()}
            </Text>
          </div>

          {event.location && (
            <div className={styles.metaItem}>
              <IconMapPin size={16} className={styles.metaIcon} />
              <Text size="sm" className={styles.metaText}>
                {event.location}
              </Text>
            </div>
          )}

          {event.attendee_count !== undefined && (
            <div className={styles.metaItem}>
              <IconUsers size={16} className={styles.metaIcon} />
              <Text size="sm" className={styles.metaText}>
                {event.attendee_count} attendees
              </Text>
            </div>
          )}
        </div>

        {event.description && (
          <Text size="sm" className={styles.eventDescription} lineClamp={2}>
            {event.description}
          </Text>
        )}
      </div>

      <div className={styles.cardFooter}>
        <Badge
          variant="unstyled"
          className={styles.typeBadge}
          data-type={event.event_type?.toLowerCase()}
        >
          {event.event_type === 'CONFERENCE' ? 'Conference' : 'Single Session'}
        </Badge>
      </div>
    </div>
  );
};

export default EventCard;