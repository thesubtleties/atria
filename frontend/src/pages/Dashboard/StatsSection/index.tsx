import { StatsGrid } from '../StatsGrid';
import type { DashboardStats } from '../index';
import styles from './styles/index.module.css';

type StatsSectionProps = {
  stats: DashboardStats | null;
};

export const StatsSection = ({ stats }: StatsSectionProps) => {
  if (!stats) return null;

  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Your Impact</h2>
      </div>
      <StatsGrid stats={stats} />
    </section>
  );
};
