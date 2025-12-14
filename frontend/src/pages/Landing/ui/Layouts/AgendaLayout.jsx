import { motion } from 'motion/react';
import styles from './AgendaLayout.module.css';

const AgendaLayout = ({
  children,
  columns = 1, // 1, 2, or 3
  gap = 'medium', // 'small', 'medium', 'large'
  staggerAnimation = true,
  staggerDelay = 0.1,
  className = '',
}) => {
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
