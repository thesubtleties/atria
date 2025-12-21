import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import styles from './AgendaLayout.module.css';

type AgendaLayoutProps = {
  children: ReactNode[];
  columns?: 1 | 2 | 3;
  gap?: 'small' | 'medium' | 'large';
  staggerAnimation?: boolean;
  staggerDelay?: number;
  className?: string;
};

const AgendaLayout = ({
  children,
  columns = 1,
  gap = 'medium',
  staggerAnimation = true,
  staggerDelay = 0.1,
  className = '',
}: AgendaLayoutProps) => {
  return (
    <div
      className={`
        ${styles.agendaLayout} 
        ${styles[`columns-${columns}`]}
        ${styles[`gap-${gap}`]}
        ${className}
      `}
    >
      {staggerAnimation ?
        children.map((child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * staggerDelay }}
          >
            {child}
          </motion.div>
        ))
      : children}
    </div>
  );
};

export default AgendaLayout;
