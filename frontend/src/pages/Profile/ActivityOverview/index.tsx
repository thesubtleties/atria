import { useGetUserDashboardQuery } from '@/app/features/users/api';
import { LoadingSpinner } from '@/shared/components/loading';
import styles from './styles/index.module.css';

type ActivityOverviewProps = {
  userId: number;
};

export const ActivityOverview = ({ userId }: ActivityOverviewProps) => {
  const { data: dashboard, isLoading } = useGetUserDashboardQuery(userId, {
    skip: !userId,
  });

  if (isLoading) {
    return (
      <section className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Activity Overview</h2>
        <div className={styles.loadingState}>
          <LoadingSpinner size='sm' />
        </div>
      </section>
    );
  }

  // Use dashboard stats and events
  const stats = {
    events_attended: dashboard?.stats?.events_attended ?? 0,
    events_hosted: dashboard?.stats?.events_hosted ?? 0,
    connections_made: dashboard?.stats?.connections_made ?? 0,
  };

  return (
    <section className={styles.profileSection}>
      <h2 className={styles.sectionTitle}>Activity Overview</h2>
      <div className={styles.activityGrid}>
        <div className={styles.activityCard}>
          <div className={styles.activityNumber}>{stats.events_attended ?? 0}</div>
          <div className={styles.activityLabel}>Events Attended</div>
        </div>
        <div className={styles.activityCard}>
          <div className={styles.activityNumber}>{stats.events_hosted ?? 0}</div>
          <div className={styles.activityLabel}>Events Hosted</div>
        </div>
        <div className={styles.activityCard}>
          <div className={styles.activityNumber}>{stats.connections_made ?? 0}</div>
          <div className={styles.activityLabel}>Connections</div>
        </div>
      </div>
    </section>
  );
};
