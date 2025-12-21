import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';
import { Button } from '@/shared/components/buttons';
import styles from './styles.module.css';

interface ErrorInfo {
  title: string;
  message: string;
  showDetails: boolean;
}

/**
 * ErrorPage - Generic route error page
 *
 * Handles route-level errors like network failures, 500s, etc.
 * Uses React Router's useRouteError hook to get error details
 */
export const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  // Determine error type and message
  const getErrorInfo = (): ErrorInfo => {
    if (isRouteErrorResponse(error)) {
      if (error.status === 404) {
        return {
          title: 'Page Not Found',
          message: "The page you're looking for doesn't exist.",
          showDetails: false,
        };
      }

      if (error.status === 403) {
        return {
          title: 'Access Denied',
          message: "You don't have permission to access this page.",
          showDetails: false,
        };
      }

      if (error.status === 500) {
        return {
          title: 'Server Error',
          message: "We're experiencing technical difficulties. Please try again later.",
          showDetails: true,
        };
      }
    }

    // Generic error
    return {
      title: 'Something Went Wrong',
      message: "We encountered an unexpected error. Don't worry — we're working to fix it.",
      showDetails: true,
    };
  };

  const errorInfo = getErrorInfo();

  // Type guard for route error response
  const routeError = isRouteErrorResponse(error) ? error : null;
  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        {/* Error Icon */}
        <div className={styles.iconContainer}>
          <svg
            className={styles.errorIcon}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className={styles.errorTitle}>{errorInfo.title}</h1>
        <p className={styles.errorMessage}>{errorInfo.message}</p>

        {/* Error Details (if applicable) */}
        {errorInfo.showDetails && error && (
          <details className={styles.errorDetails}>
            <summary className={styles.errorDetailsSummary}>Technical Details</summary>
            <div className={styles.errorDetailsContent}>
              {routeError && (
                <p className={styles.errorName}>
                  Status: {routeError.status} {routeError.statusText}
                </p>
              )}
              {routeError?.data && (
                <p className={styles.errorData}>
                  {typeof routeError.data === 'string'
                    ? routeError.data
                    : JSON.stringify(routeError.data, null, 2)}
                </p>
              )}
              {errorMessage && <p className={styles.errorData}>{errorMessage}</p>}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <Button onClick={() => navigate(-1)} variant='secondary'>
            Go Back
          </Button>
          <Button onClick={() => navigate('/app/dashboard')} variant='primary'>
            Go to Dashboard
          </Button>
        </div>

        {/* Help Text */}
        <p className={styles.helpText}>
          If this problem persists, please{' '}
          <a
            href='https://github.com/anthropics/claude-code/issues'
            target='_blank'
            rel='noopener noreferrer'
            className={styles.helpLink}
          >
            report the issue
          </a>
          .
        </p>
      </div>
    </div>
  );
};
