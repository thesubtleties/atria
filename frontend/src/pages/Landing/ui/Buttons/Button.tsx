import type { ReactNode, MouseEvent } from 'react';
import { motion } from 'motion/react';
import type { ButtonVariant, ButtonSize, IconPosition } from '../../types';
import styles from './Button.module.css';

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode | null;
  iconPosition?: IconPosition;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  animate?: boolean;
  className?: string;
};

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon = null,
  iconPosition = 'left',
  onClick,
  disabled = false,
  fullWidth = false,
  animate = true,
  className = '',
  ...props
}: ButtonProps) => {
  const buttonContent = (
    <>
      {icon && iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
    </>
  );

  const buttonClass = `
    ${styles.button} 
    ${styles[`variant-${variant}`]} 
    ${styles[`size-${size}`]}
    ${fullWidth ? styles.fullWidth : ''}
    ${disabled ? styles.disabled : ''}
    ${className}
  `.trim();

  if (animate) {
    return (
      <motion.button
        className={buttonClass}
        onClick={onClick}
        disabled={disabled}
        {...(!disabled ? { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } : {})}
        {...props}
      >
        {buttonContent}
      </motion.button>
    );
  }

  return (
    <button className={buttonClass} onClick={onClick} disabled={disabled} {...props}>
      {buttonContent}
    </button>
  );
};

export default Button;
