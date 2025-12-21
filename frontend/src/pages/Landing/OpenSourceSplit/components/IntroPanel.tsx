import { motion } from 'motion/react';
import styles from './IntroPanel.module.css';

type IntroPanelProps = {
  title: string;
  subtitle: string;
  description?: string;
};

export const IntroPanel = ({ title, subtitle, description }: IntroPanelProps) => {
  return (
    <div className={`${styles.panel} ${styles.introPanel} panel`}>
      <div className={`${styles.panelContent} panel-content`}>
        <h2 className={styles.introTitle}>{title}</h2>
        <p className={styles.introSubtitle}>{subtitle}</p>
        {description && <p className={styles.introDescription}>{description}</p>}
        <motion.div
          className={styles.scrollIndicator}
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span>Explore your options</span>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
            <path
              d='M9 18l6-6-6-6'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
};
