import { Text, Badge } from '@mantine/core';
import { IconCalendar, IconMapPin, IconUsers, IconBuilding, IconClock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useFormatDate } from '@/shared/hooks/formatDate';
import type { Event } from '@/types/events';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type AttendeeEventCardProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: Event | Record<string, any>;
  status?: 'live' | 'upcoming' | 'past' | undefined;
};

type EventWithExtras = {
  location?: string;
  attendee_count?: number;
};

export const AttendeeEventCard = ({ event, status }: AttendeeEventCardProps) => {
  const navigate = useNavigate();
  const { formatDate } = useFormatDate();

  const handleCardClick = () => {
    navigate(`/app/events/${event.id}`);
  };

  const formatEventDates = (): string => {
    const startDate = formatDate(event.start_date);
    const endDate = formatDate(event.end_date);

    if (startDate === endDate) {
      return startDate;
    }
    return `${startDate} - ${endDate}`;
  };

  const getStatusColor = (): string => {
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

  const getStatusBadgeLabel = (): string => {
    if (status === 'live') return 'Live Now';
    if (status === 'upcoming') return 'Coming Soon';
    return 'Ended';
  };

  return (
    <div className={cn(styles.eventCard)} onClick={handleCardClick}>
      {/* Card Header with Status */}
      <div className={cn(styles.cardHeader)}>
        <Badge
          variant='light'
          color={getStatusColor()}
          className={cn(styles.statusBadge)}
          data-status={status}
          leftSection={status === 'live' ? <IconClock size={14} /> : null}
        >
          {getStatusBadgeLabel()}
        </Badge>
        <Badge
          variant='subtle'
          className={cn(styles.typeBadge)}
          data-type={event.event_type}
        >
          {event.event_type === 'conference' ? 'Conference' : 'Single Session'}
        </Badge>
      </div>

      {/* Main Content */}
      <div className={cn(styles.cardContent)}>
        <h3 className={cn(styles.eventTitle)}>{event.title}</h3>

        {/* Organization Info */}
        {(((event as Record<string, unknown>).organization as { name?: string })?.name ||
          (event as Record<string, unknown>).organization_name ||
          event.company_name) && (
          <div className={cn(styles.organizationInfo)}>
            <IconBuilding size={16} className={cn(styles.metaIcon)} />
            <Text size='sm' className={cn(styles.organizationName)}>
              {((event as Record<string, unknown>).organization as { name?: string })?.name ||
                ((event as Record<string, unknown>).organization_name as string) ||
                event.company_name}
            </Text>
          </div>
        )}

        {/* Event Meta Information */}
        <div className={cn(styles.eventMeta)}>
          <div className={cn(styles.metaItem)}>
            <IconCalendar size={16} className={cn(styles.metaIcon)} />
            <Text size='sm' className={cn(styles.metaText)}>
              {formatEventDates()}
            </Text>
          </div>

          {(event as EventWithExtras).location && (
            <div className={cn(styles.metaItem)}>
              <IconMapPin size={16} className={cn(styles.metaIcon)} />
              <Text size='sm' className={cn(styles.metaText)}>
                {(event as EventWithExtras).location}
              </Text>
            </div>
          )}

          {(event as EventWithExtras).attendee_count !== undefined &&
            ((event as EventWithExtras).attendee_count ?? 0) > 0 && (
              <div className={cn(styles.metaItem)}>
                <IconUsers size={16} className={cn(styles.metaIcon)} />
                <Text size='sm' className={cn(styles.metaText)}>
                  {(event as EventWithExtras).attendee_count}{' '}
                  {(event as EventWithExtras).attendee_count === 1 ? 'attendee' : 'attendees'}
                </Text>
              </div>
            )}
        </div>

        {/* Description */}
        {event.description && (
          <Text size='sm' className={cn(styles.eventDescription)} lineClamp={3}>
            {event.description}
          </Text>
        )}
      </div>

      {/* Card Footer - Action area */}
      <div className={cn(styles.cardFooter)}>
        <Text size='sm' className={cn(styles.viewDetailsText)}>
          {status === 'live' ? 'Join Event →' : 'View Details →'}
        </Text>
      </div>
    </div>
  );
};
