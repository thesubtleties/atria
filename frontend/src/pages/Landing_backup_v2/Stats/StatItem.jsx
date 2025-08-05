import styles from './styles/StatItem.module.css';

export const StatItem = ({ value, label }) => (
  <div className={styles.statItem}>
    <span className={styles.value}>{value}</span>
    <span className={styles.label}>{label}</span>
  </div>
);
