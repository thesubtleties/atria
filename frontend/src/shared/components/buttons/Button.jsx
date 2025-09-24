import { ButtonLoader } from '../loading';
import styles from './Button.module.css';

export const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const buttonClass = `${styles.btn} ${styles[`btn-${variant}`]} ${className}`;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClass}
      {...props}
    >
      {loading ? (
        <>
          <ButtonLoader />
          <span style={{ marginLeft: '8px' }}>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};