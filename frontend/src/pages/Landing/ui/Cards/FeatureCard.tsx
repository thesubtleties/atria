import type { MouseEvent } from 'react';
import { motion } from 'motion/react';
import styles from './FeatureCard.module.css';

type FeatureCardProps = {
  icon?: string;
  title?: string;
  description?: string;
  hoverDirection?: 'left' | 'right';
  delay?: number;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  className?: string;
};

const FeatureCard = ({
  icon = '',
  title = '',
  description = '',
  hoverDirection = 'right',
  delay = 0,
  onClick,
  className = '',
}: FeatureCardProps) => {
  const hoverX = hoverDirection === 'right' ? 10 : -10;

  return (
    <motion.div
      className={`${styles.featureCard} ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ x: hoverX }}
      transition={{
        type: 'spring',
        stiffness: 300,
        delay,
      }}
      onClick={onClick}
      viewport={{ once: true }}
    >
      {icon && (
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>{icon}</span>
        </div>
      )}

      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </motion.div>
  );
};

export default FeatureCard;
