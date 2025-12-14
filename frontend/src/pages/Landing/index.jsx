import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import App from './App';

// Lazy-load notifications - only needed for email verification/password reset redirects
const loadNotifications = () =>
  import('@mantine/notifications').then((m) => ({ showNotification: m.showNotification }));

export const Landing = () => {
  const location = useLocation();

  useEffect(() => {
    // Mark body as landing page so critical CSS can target it specifically
    // This prevents critical CSS from accidentally affecting app pages
    document.body.dataset.page = 'landing';

    // NOTE: .hydrated class is now added by Hero component AFTER GSAP initializes
    // This prevents the yellow flash during hydration by keeping critical CSS active
    // until GSAP ScrollTrigger is ready to take over

    // Cleanup: remove landing page marker when unmounting
    return () => {
      delete document.body.dataset.page;
    };
  }, []);

  useEffect(() => {
    // Skip during pre-rendering
    if (
      navigator.userAgent.includes('PrerendererBot') ||
      navigator.userAgent.includes('Headless')
    ) {
      return;
    }

    // Check if we're coming from email verification or password reset
    if (location.state?.emailVerified || location.state?.passwordReset) {
      // Lazy-load notifications only when needed
      loadNotifications().then(({ showNotification }) => {
        if (location.state?.emailVerified) {
          showNotification({
            title: 'Email Verified!',
            message: location.state.message || 'Your email has been verified. You can now log in.',
            color: 'green',
          });
          window.history.replaceState({}, document.title);
        } else if (location.state?.passwordReset) {
          showNotification({
            title: 'Password Reset!',
            message: location.state.message || 'Your password has been reset. You can now log in.',
            color: 'green',
          });
          window.history.replaceState({}, document.title);
        }
      });
    }
  }, [location]);

  return <App />;
};
