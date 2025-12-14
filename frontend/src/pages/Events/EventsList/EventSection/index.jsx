import { AttendeeEventCard } from '../AttendeeEventCard';
import { EventInvitationCard } from '../EventInvitationCard';
import styles from '../styles/index.module.css';

export const EventSection = ({ icon: Icon, title, items, type, status }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className={styles.eventCategory}>
      <div className={styles.categoryHeader}>
        <Icon size={24} className={styles.categoryIcon} />
        <h2 className={styles.categoryTitle}>{title}</h2>
        <span className={styles.eventCount}>{items.length}</span>
      </div>
      <div className={styles.eventsGrid}>
        {items.map((item) =>
          type === 'invitation' ?
            <EventInvitationCard key={item.id} invitation={item} />
          : <AttendeeEventCard key={item.id} event={item} status={status} />,
        )}
      </div>
    </section>
  );
};
