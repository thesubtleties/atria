import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { Button } from "@/shared/components/buttons";
import styles from "./styles.module.css";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/app/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <div className={styles.iconContainer}>
              <svg
                className={styles.errorIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className={styles.errorTitle}>Oops! Something went wrong</h1>
            <p className={styles.errorMessage}>
              {
                "We encountered an unexpected error. Don't worry — your data is safe, and we're working to fix this."
              }
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className={styles.errorDetails}>
                <summary className={styles.errorDetailsSummary}>
                  Error Details (Development Only)
                </summary>
                <div className={styles.errorDetailsContent}>
                  <p className={styles.errorName}>
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className={styles.errorStack}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className={styles.actionButtons}>
              <Button onClick={this.handleReset} variant="secondary">
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="primary">
                Go to Dashboard
              </Button>
            </div>

            <p className={styles.helpText}>
              If this problem persists, please{" "}
              <a
                href="https://github.com/anthropics/claude-code/issues"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.helpLink}
              >
                report the issue
              </a>
              .
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
