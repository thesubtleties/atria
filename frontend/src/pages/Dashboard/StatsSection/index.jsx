import { StatsGrid } from '../StatsGrid';
import styles from './styles/index.module.css';

export const StatsSection = ({ stats }) => {
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