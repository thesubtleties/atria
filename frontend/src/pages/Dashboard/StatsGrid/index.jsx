import React from 'react';
import styles from './styles/index.module.css';

export const StatsGrid = ({ stats }) => {
  if (!stats) return null;

  const statItems = [
    { label: 'Events Hosted', value: stats.events_hosted },
    { label: 'Attendees Reached', value: stats.attendees_reached },
    { label: 'Connections Made', value: stats.connections_made },
    { label: 'Events Attended', value: stats.events_attended },
    { label: 'Organizations', value: stats.organizations_count },
  ];

  return (
    <div className={styles.statsGrid}>
      {statItems.map((stat, index) => (
        <div key={index} className={styles.statCard}>
          <div className={styles.statNumber}>{stat.value}</div>
          <div className={styles.statLabel}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
};