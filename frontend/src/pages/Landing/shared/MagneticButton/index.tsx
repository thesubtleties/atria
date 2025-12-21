import type { ReactNode, MouseEvent } from 'react';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { ButtonVariant } from '../../types';
import styles from './MagneticButton.module.css';

type MagneticButtonProps = {
  children: ReactNode;
  variant?: Exclude<ButtonVariant, 'ghost'>;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  magnetStrength?: number;
};

const MagneticButton = ({
  children,
  variant = 'primary',
  onClick,
  className = '',
  magnetStrength = 0.3,
  ...props
}: MagneticButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouchDevice();
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    // Skip magnetic effect on touch devices for better performance
    if (!buttonRef.current || isTouchDevice) return;

    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Calculate distance from center
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const maxDistance = width;

    // Only apply magnetic effect within range
    if (distance < maxDistance) {
      const strength = 1 - distance / maxDistance;
      setPosition({
        x: distanceX * magnetStrength * strength,
        y: distanceY * magnetStrength * strength,
      });
    }
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`${styles.button} ${styles[variant]} ${className || ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        x: isTouchDevice ? 0 : position.x,
        y: isTouchDevice ? 0 : position.y,
      }}
      transition={{
        type: 'spring',
        stiffness: isTouchDevice ? 300 : 150,
        damping: isTouchDevice ? 25 : 15,
        mass: 0.5,
      }}
      {...(!isTouchDevice ? { whileHover: { scale: 1.05 } } : {})}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <span className={styles.content}>{children}</span>
      <motion.div
        className={styles.glow}
        animate={{
          opacity: !isTouchDevice && (position.x !== 0 || position.y !== 0) ? 0.3 : 0,
        }}
      />
    </motion.button>
  );
};

export default MagneticButton;
