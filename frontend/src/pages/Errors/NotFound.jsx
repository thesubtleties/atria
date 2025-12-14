import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/buttons';
import styles from './styles.module.css';

/**
 * NotFound - Branded 404 page
 *
 * Shows when users navigate to a route that doesn't exist
 */
export const NotFound = () => {
  const navigate = useNavigate();

  const suggestions = [
    {
      title: 'Dashboard',
      description: 'View your events and connections',
      path: '/app/dashboard',
      icon: (
        <svg
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
          />
        </svg>
      ),
    },
    {
      title: 'Events',
      description: 'Browse and manage events',
      path: '/app/events',
      icon: (
        <svg
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      ),
    },
    {
      title: 'Network',
      description: 'Connect with attendees',
      path: '/app/network',
      icon: (
        <svg
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
          />
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        {/* 404 Illustration */}
        <div className={styles.illustration}>
          <div className={styles.fourOhFour}>404</div>
        </div>

        {/* Main Message */}
        <h1 className={styles.errorTitle}>Page Not Found</h1>
        <p className={styles.errorMessage}>
          {
            "Looks like you've ventured into uncharted territory! The page you're looking for doesn't exist or may have been moved."
          }
        </p>

        {/* Suggestions */}
        <div className={styles.suggestions}>
          <p className={styles.suggestionsTitle}>Try one of these instead:</p>
          <div className={styles.suggestionCards}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.path}
                className={styles.suggestionCard}
                onClick={() => navigate(suggestion.path)}
              >
                <div className={styles.suggestionIcon}>{suggestion.icon}</div>
                <div className={styles.suggestionContent}>
                  <div className={styles.suggestionTitle}>{suggestion.title}</div>
                  <div className={styles.suggestionDescription}>{suggestion.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <Button onClick={() => navigate(-1)} variant='secondary'>
            Go Back
          </Button>
          <Button onClick={() => navigate('/app/dashboard')} variant='primary'>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
