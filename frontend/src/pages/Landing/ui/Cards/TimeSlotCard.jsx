import { motion } from 'motion/react';
import styles from './TimeSlotCard.module.css';

const TimeSlotCard = ({
  time = '',
  title = '',
  subtitle = '',
  badge = '',
  badgeColor = 'primary',
  isActive = false,
  onClick,
  delay = 0,
  className = '',
}) => {
  return (
    <motion.div
      className={`${styles.timeSlotCard} ${isActive ? styles.active : ''} ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
    >
      <div className={styles.timeWrapper}>
        <span className={styles.time}>{time}</span>
      </div>

      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {badge && <div className={`${styles.badge} ${styles[`badge-${badgeColor}`]}`}>{badge}</div>}
    </motion.div>
  );
};

export default TimeSlotCard;
