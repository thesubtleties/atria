import { Text, Badge } from '@mantine/core';
import {
  IconCalendar,
  IconMapPin,
  IconUsers,
  IconBuilding,
  IconClock,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useFormatDate } from '@/shared/hooks/formatDate';
import { getEventStatusLabel } from '../utils/eventCategorization';
import styles from './styles/index.module.css';

export const AttendeeEventCard = ({ event, status }) => {
  const navigate = useNavigate();
  const { formatDate } = useFormatDate();

  const handleCardClick = () => {
    navigate(`/app/events/${event.id}`);
  };

  const formatEventDates = () => {
    const startDate = formatDate(event.start_date);
    const endDate = formatDate(event.end_date);

    if (startDate === endDate) {
      return startDate;
    }
    return `${startDate} - ${endDate}`;
  };

  const getStatusColor = () => {
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

  const getStatusBadgeLabel = () => {
    if (status === 'live') return 'Live Now';
    return getEventStatusLabel(event);
  };

  return (
    <div className={styles.eventCard} onClick={handleCardClick}>
      {/* Card Header with Status */}
      <div className={styles.cardHeader}>
        <Badge
          variant="light"
          color={getStatusColor()}
          className={styles.statusBadge}
          data-status={status}
          leftSection={status === 'live' ? <IconClock size={14} /> : null}
        >
          {getStatusBadgeLabel()}
        </Badge>
        <Badge
          variant="subtle"
          className={styles.typeBadge}
          data-type={event.event_type?.toLowerCase()}
        >
          {event.event_type === 'CONFERENCE' ? 'Conference' : 'Single Session'}
        </Badge>
      </div>

      {/* Main Content */}
      <div className={styles.cardContent}>
        <h3 className={styles.eventTitle}>{event.title}</h3>

        {/* Organization Info */}
        {(event.organization?.name ||
          event.organization_name ||
          event.company_name) && (
          <div className={styles.organizationInfo}>
            <IconBuilding size={16} className={styles.metaIcon} />
            <Text size="sm" className={styles.organizationName}>
              {event.organization?.name ||
                event.organization_name ||
                event.company_name}
            </Text>
          </div>
        )}

        {/* Event Meta Information */}
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

          {event.attendee_count !== undefined && event.attendee_count > 0 && (
            <div className={styles.metaItem}>
              <IconUsers size={16} className={styles.metaIcon} />
              <Text size="sm" className={styles.metaText}>
                {event.attendee_count}{' '}
                {event.attendee_count === 1 ? 'attendee' : 'attendees'}
              </Text>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <Text size="sm" className={styles.eventDescription} lineClamp={3}>
            {event.description}
          </Text>
        )}
      </div>

      {/* Card Footer - Action area */}
      <div className={styles.cardFooter}>
        <Text size="sm" className={styles.viewDetailsText}>
          {status === 'live' ? 'Join Event →' : 'View Details →'}
        </Text>
      </div>
    </div>
  );
};
