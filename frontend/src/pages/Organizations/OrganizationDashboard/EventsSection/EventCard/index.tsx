import { Text, Badge } from '@mantine/core';
import { IconCalendar, IconUsers, IconMapPin } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useFormatDate } from '@/shared/hooks/formatDate';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type Event = {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  status?: string;
  event_type?: string;
  attendee_count?: number;
};

type EventCardProps = {
  event: Event;
};

const EventCard = ({ event }: EventCardProps) => {
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

  return (
    <div className={cn(styles.eventCard)} onClick={handleCardClick}>
      <div className={cn(styles.cardHeader)}>
        <Badge
          variant='light'
          className={cn(styles.statusBadge)}
          data-status={event.status?.toLowerCase()}
        >
          {event.status}
        </Badge>
      </div>

      <div className={cn(styles.cardContent)}>
        <h3 className={cn(styles.eventTitle)}>{event.title}</h3>

        <div className={cn(styles.eventMeta)}>
          <div className={cn(styles.metaItem)}>
            <IconCalendar size={16} className={cn(styles.metaIcon)} />
            <Text size='sm' className={cn(styles.metaText)}>
              {formatEventDates()}
            </Text>
          </div>

          {event.location && (
            <div className={cn(styles.metaItem)}>
              <IconMapPin size={16} className={cn(styles.metaIcon)} />
              <Text size='sm' className={cn(styles.metaText)}>
                {event.location}
              </Text>
            </div>
          )}

          {event.attendee_count !== undefined && (
            <div className={cn(styles.metaItem)}>
              <IconUsers size={16} className={cn(styles.metaIcon)} />
              <Text size='sm' className={cn(styles.metaText)}>
                {event.attendee_count} attendees
              </Text>
            </div>
          )}
        </div>

        {event.description && (
          <Text size='sm' className={cn(styles.eventDescription)} lineClamp={2}>
            {event.description}
          </Text>
        )}
      </div>

      <div className={cn(styles.cardFooter)}>
        <Badge variant='light' className={cn(styles.typeBadge)} data-type={event.event_type}>
          {event.event_type === 'conference' ? 'Conference' : 'Single Session'}
        </Badge>
      </div>
    </div>
  );
};

export default EventCard;
