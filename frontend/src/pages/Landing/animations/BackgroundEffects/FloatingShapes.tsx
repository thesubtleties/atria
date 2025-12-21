import { motion } from 'motion/react';
import type { MotionProps, Easing } from 'motion/react';
import styles from './FloatingShapes.module.css';

type ShapeConfig = {
  className: string;
  animate: MotionProps['animate'];
  duration: number;
  ease: Easing | Easing[];
};

type FloatingShapesProps = {
  shapes?: ShapeConfig[];
  className?: string;
};

const defaultShapes: ShapeConfig[] = [
  {
    className: 'shape1',
    animate: {
      x: [0, 30, 0],
      y: [0, -40, 0],
      rotate: [0, 180, 360],
    },
    duration: 20,
    ease: [0.45, 0.05, 0.55, 0.95],
  },
  {
    className: 'shape2',
    animate: {
      x: [0, -40, 0],
      y: [0, 30, 0],
      rotate: [0, -180, -360],
    },
    duration: 25,
    ease: [0.43, 0.13, 0.23, 0.96],
  },
  {
    className: 'shape3',
    animate: {
      x: [0, 20, 0],
      y: [0, 20, 0],
      scale: [1, 1.1, 1],
    },
    duration: 15,
    ease: [0.34, 1.56, 0.64, 1],
  },
];

const FloatingShapes = ({ shapes = defaultShapes, className = '' }: FloatingShapesProps) => {
  return (
    <div className={`${styles.backgroundShapes} ${className}`}>
      {shapes.map((shape, index) => {
        if (!shape.animate) return null;
        return (
          <motion.div
            key={index}
            className={`${styles.shape} ${styles[shape.className]}`}
            animate={shape.animate}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              ease: shape.ease,
            }}
          />
        );
      })}
    </div>
  );
};

export default FloatingShapes;
