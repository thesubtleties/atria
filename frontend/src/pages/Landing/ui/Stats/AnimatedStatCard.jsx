import { motion } from 'motion/react';
import styles from './AnimatedStatCard.module.css';

const AnimatedStatCard = ({
  number = 0,
  label = '',
  icon = '',
  delay = 0,
  formatNumber = true,
  className = '',
}) => {
  const displayNumber = formatNumber ? number.toLocaleString() : number;

  return (
    <motion.div
      className={`${styles.statCard} ${className}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300, delay }}
      viewport={{ once: true }}
    >
      <div className={styles.statNumber}>{displayNumber}</div>
      <div className={styles.statLabel}>{label}</div>
      {icon && <div className={styles.statIcon}>{icon}</div>}
    </motion.div>
  );
};

export default AnimatedStatCard;
