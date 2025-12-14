import { motion } from 'motion/react';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost'
  size = 'medium', // 'small', 'medium', 'large'
  icon = null,
  iconPosition = 'left', // 'left', 'right'
  onClick,
  disabled = false,
  fullWidth = false,
  animate = true,
  className = '',
  ...props
}) => {
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
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
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
