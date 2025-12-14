import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import styles from './ScrollIndicator.module.css';

const ScrollIndicator = ({
  text = 'Scroll to explore',
  className = '',
  animationDuration = 1.5,
  animationDistance = 10,
}) => {
  const indicatorRef = useRef(null);

  useEffect(() => {
    if (!indicatorRef.current) return;

    const tween = gsap.to(indicatorRef.current, {
      y: animationDistance,
      duration: animationDuration,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    return () => {
      tween.kill();
    };
  }, [animationDuration, animationDistance]);

  return (
    <div ref={indicatorRef} className={`${styles.scrollIndicator} ${className}`}>
      <span className={styles.scrollText}>{text}</span>
      <svg className={styles.scrollArrow} width='24' height='24' viewBox='0 0 24 24' fill='none'>
        <path
          d='M12 5v14m0 0l-7-7m7 7l7-7'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </div>
  );
};

export default ScrollIndicator;
