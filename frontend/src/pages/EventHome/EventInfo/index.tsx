import { IconCalendar, IconMapPin, IconDeviceLaptop } from '@tabler/icons-react';
import { format as formatDate, parseISO } from 'date-fns';
import type { USState } from '@/types/enums';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type Venue = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: USState | string | null;
  country?: string | null;
};

type Dates = {
  start: string;
  end: string;
};

type EventInfoProps = {
  format: string;
  venue: Venue;
  dates: Dates;
};

export default function EventInfo({ format, venue, dates }: EventInfoProps) {
  return (
    <section className={cn(styles.eventInfo)}>
      <div className={cn(styles.container)}>
        <div className={cn(styles.grid)}>
          <div className={cn(styles.infoCard)}>
            <div className={cn(styles.iconWrapper)}>
              <IconCalendar size={28} className={cn(styles.icon)} />
            </div>
            <div className={cn(styles.cardContent)}>
              <h3 className={cn(styles.cardTitle)}>When</h3>
              <p className={cn(styles.cardText)}>
                {formatDate(parseISO(dates.start), 'MMMM d, yyyy')}
              </p>
              {dates.end !== dates.start && (
                <p className={cn(styles.cardSubtext)}>
                  to {formatDate(parseISO(dates.end), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          </div>

          {venue.name && (
            <div className={cn(styles.infoCard)}>
              <div className={cn(styles.iconWrapper)}>
                <IconMapPin size={28} className={cn(styles.icon)} />
              </div>
              <div className={cn(styles.cardContent)}>
                <h3 className={cn(styles.cardTitle)}>Where</h3>
                <p className={cn(styles.cardText)}>{venue.name}</p>
                <p className={cn(styles.cardSubtext)}>
                  {venue.city}
                  {venue.state ? `, ${venue.state}` : ''}, {venue.country}
                </p>
              </div>
            </div>
          )}

          <div className={cn(styles.infoCard)}>
            <div className={cn(styles.iconWrapper)}>
              <IconDeviceLaptop size={28} className={cn(styles.icon)} />
            </div>
            <div className={cn(styles.cardContent)}>
              <h3 className={cn(styles.cardTitle)}>Format</h3>
              <p className={cn(styles.cardText)}>
                {format?.toLowerCase() === 'hybrid' ? 'Hybrid Event' : 'Virtual Event'}
              </p>
              <p className={cn(styles.cardSubtext)}>
                {format?.toLowerCase() === 'hybrid' ?
                  'Join in-person or online'
                : 'Join from anywhere'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
