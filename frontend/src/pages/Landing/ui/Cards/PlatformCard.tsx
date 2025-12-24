import type { ReactNode, MouseEvent } from 'react';
import { motion } from 'motion/react';
import styles from './PlatformCard.module.css';

type PlatformCardProps = {
  title?: string;
  subtitle?: string;
  icon?: string;
  features?: string[];
  ctaText?: string;
  ctaIcon?: ReactNode | null;
  variant?: 'default' | 'primary' | 'gradient';
  onCtaClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  delay?: number;
  className?: string;
};

const PlatformCard = ({
  title = '',
  subtitle = '',
  icon = '',
  features = [],
  ctaText = '',
  ctaIcon = null,
  variant = 'default',
  onCtaClick,
  delay = 0,
  className = '',
}: PlatformCardProps) => {
  return (
    <motion.div
      className={`${styles.platformCard} ${styles[`variant-${variant}`]} ${className}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      viewport={{ once: true }}
    >
      {icon && (
        <div className={styles.iconSection}>
          <span className={styles.icon}>{icon}</span>
        </div>
      )}

      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {features.length > 0 && (
        <ul className={styles.featuresList}>
          {features.map((feature, index) => (
            <li key={index} className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      {ctaText && (
        <motion.button
          className={styles.ctaButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCtaClick}
        >
          {ctaIcon}
          {ctaText}
        </motion.button>
      )}
    </motion.div>
  );
};

export default PlatformCard;
