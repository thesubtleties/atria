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

  // Dashboard doesn't have stats, compute from available data
  const stats = {
    events_attended: dashboard?.upcoming_events?.length ?? 0,
    events_hosted: 0, // Not available in dashboard
    connections_made: dashboard?.pending_connections ?? 0,
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
