import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { showNotification } from '@mantine/notifications';
import { Hero } from './Hero';
import { Features } from './Features';
import { Stats } from './Stats';
import { Testimonials } from './Testimonials';
import styles from './index.module.css';

export const Landing = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if we're coming from email verification or password reset
    if (location.state?.emailVerified) {
      showNotification({
        title: 'Email Verified!',
        message: location.state.message || 'Your email has been verified. You can now log in.',
        color: 'green',
      });
      // Clear the state to prevent showing notification again on refresh
      window.history.replaceState({}, document.title);
    } else if (location.state?.passwordReset) {
      showNotification({
        title: 'Password Reset!',
        message: location.state.message || 'Your password has been reset. You can now log in.',
        color: 'green',
      });
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <main className={styles.mainContainer}>
      <Hero />
      <Stats />
      <Features />
      <Testimonials />
    </main>
  );
};
