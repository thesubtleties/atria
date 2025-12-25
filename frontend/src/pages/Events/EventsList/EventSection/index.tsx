import type { Icon } from '@tabler/icons-react';
import { AttendeeEventCard } from '../AttendeeEventCard';
import { EventInvitationCard } from '../EventInvitationCard';
import { cn } from '@/lib/cn';
import styles from '../styles/index.module.css';

type EventInvitation = {
  id: number;
  token: string;
  role: string;
  message?: string;
  created_at: string;
  event: {
    id: number;
    title: string;
    start_date?: string;
    end_date?: string;
    location?: string;
    organization: {
      id: number;
      name: string;
    };
  };
  invited_by?: {
    name: string;
  };
};

type EventItem = {
  id: number;
  title?: string;
  [key: string]: unknown;
};

type EventSectionProps = {
  icon: Icon;
  title: string;
  items: EventInvitation[] | EventItem[];
  type: 'invitation' | 'event';
  status?: 'live' | 'upcoming' | 'past' | undefined;
};

export const EventSection = ({ icon: Icon, title, items, type, status }: EventSectionProps) => {
  if (!items || items.length === 0) return null;

  return (
    <section className={cn(styles.eventCategory)}>
      <div className={cn(styles.categoryHeader)}>
        <Icon size={24} className={cn(styles.categoryIcon)} />
        <h2 className={cn(styles.categoryTitle)}>{title}</h2>
        <span className={cn(styles.eventCount)}>{items.length}</span>
      </div>
      <div className={cn(styles.eventsGrid)}>
        {items.map((item) =>
          type === 'invitation' ?
            <EventInvitationCard key={item.id} invitation={item as EventInvitation} />
          : <AttendeeEventCard key={item.id} event={item as EventItem} status={status} />,
        )}
      </div>
    </section>
  );
};
