import { Loader, LoadingOverlay, Skeleton, Center, Text, Stack } from '@mantine/core';
import styles from './styles/LoadingState.module.css';

/**
 * Standardized loading components for Atria
 * Uses brand purple (#8B5CF6) consistently across all loading states
 */

// Standard inline loader - use for buttons, small sections
export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'var(--color-primary)',
  ...props 
}) => (
  <Loader 
    size={size} 
    color={color}
    {...props}
  />
);

// Centered loading state - use for card/section content
export const LoadingContent = ({ 
  message = 'Loading...', 
  size = 'md',
  showMessage = true 
}) => (
  <Center className={styles.loadingContent}>
    <Stack align="center" gap="md">
      <LoadingSpinner size={size} />
      {showMessage && (
        <Text c="dimmed" size="sm" className={styles.loadingText}>
          {message}
        </Text>
      )}
    </Stack>
  </Center>
);

// Full section loading - use for page sections
export const LoadingSection = ({ 
  height = 200,
  message = 'Loading...' 
}) => (
  <div className={styles.loadingSection} style={{ minHeight: height }}>
    <LoadingContent message={message} />
  </div>
);

// Loading overlay - use for forms, modals, or sections being updated
export const LoadingOverlayCustom = ({ 
  visible,
  message,
  blur = 2,
  ...props 
}) => (
  <LoadingOverlay
    visible={visible}
    zIndex={1000}
    overlayProps={{ blur }}
    loaderProps={{ 
      color: 'var(--color-primary)',
      size: 'lg'
    }}
    {...props}
  />
);

// Skeleton loader - use for content placeholders
export const LoadingSkeleton = ({ 
  lines = 3,
  height = 10,
  ...props 
}) => (
  <Stack gap="xs">
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton 
        key={index} 
        height={height} 
        radius="md"
        {...props}
      />
    ))}
  </Stack>
);

// Card skeleton - use for card lists
export const LoadingCard = () => (
  <div className={styles.loadingCard}>
    <Skeleton height={60} circle mb="sm" />
    <Skeleton height={8} radius="md" />
    <Skeleton height={8} mt={6} radius="md" />
    <Skeleton height={8} mt={6} width="70%" radius="md" />
  </div>
);

// Table row skeleton - use for table loading states
export const LoadingTableRow = ({ columns = 4 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index}>
        <Skeleton height={8} radius="md" />
      </td>
    ))}
  </tr>
);

// Page-level loading - use for initial page loads
export const LoadingPage = ({ message = 'Loading page...' }) => (
  <div className={styles.loadingPage}>
    <LoadingContent message={message} size="lg" />
  </div>
);

// Button loading state - use inside buttons
export const ButtonLoader = () => (
  <LoadingSpinner size="xs" color="currentColor" />
);

// Export all components as default object for convenient imports
const LoadingState = {
  Spinner: LoadingSpinner,
  Content: LoadingContent,
  Section: LoadingSection,
  Overlay: LoadingOverlayCustom,
  Skeleton: LoadingSkeleton,
  Card: LoadingCard,
  TableRow: LoadingTableRow,
  Page: LoadingPage,
  Button: ButtonLoader,
};

export default LoadingState;