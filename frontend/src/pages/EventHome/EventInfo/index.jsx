// pages/EventHome/EventInfo/index.jsx
import {
  IconCalendar,
  IconMapPin,
  IconDeviceLaptop,
} from '@tabler/icons-react';
import styles from './styles/index.module.css';

export default function EventInfo({ format, venue, dates }) {
  return (
    <section className={styles.eventInfo}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <IconCalendar size={28} className={styles.icon} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>When</h3>
              <p className={styles.cardText}>
                {new Date(dates.start).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              {dates.end !== dates.start && (
                <p className={styles.cardSubtext}>
                  to {new Date(dates.end).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>

          {venue.name && (
            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <IconMapPin size={28} className={styles.icon} />
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>Where</h3>
                <p className={styles.cardText}>{venue.name}</p>
                <p className={styles.cardSubtext}>
                  {venue.city}, {venue.country}
                </p>
              </div>
            </div>
          )}

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <IconDeviceLaptop size={28} className={styles.icon} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Format</h3>
              <p className={styles.cardText}>
                {format === 'HYBRID' ? 'Hybrid Event' : 'Virtual Event'}
              </p>
              <p className={styles.cardSubtext}>
                {format === 'HYBRID' 
                  ? 'Join in-person or online' 
                  : 'Join from anywhere'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
