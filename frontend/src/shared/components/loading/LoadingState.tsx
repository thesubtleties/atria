import { Loader, LoadingOverlay, Skeleton, Center, Text, Stack } from '@mantine/core';
import styles from './styles/LoadingState.module.css';

/**
 * Standardized loading components for Atria
 * Uses brand purple (#8B5CF6) consistently across all loading states
 */

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

export const LoadingSpinner = ({
  size = 'md',
  color = 'var(--color-primary)',
  ...props
}: LoadingSpinnerProps) => <Loader size={size} color={color} {...props} />;

interface LoadingContentProps {
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showMessage?: boolean;
}

export const LoadingContent = ({
  message = 'Loading...',
  size = 'md',
  showMessage = true,
}: LoadingContentProps) => (
  <Center className={styles.loadingContent || ''}>
    <Stack align='center' gap='md'>
      <LoadingSpinner size={size} />
      {showMessage && (
        <Text c='dimmed' size='sm' className={styles.loadingText || ''}>
          {message}
        </Text>
      )}
    </Stack>
  </Center>
);

interface LoadingSectionProps {
  height?: number;
  message?: string;
}

export const LoadingSection = ({ height = 200, message = 'Loading...' }: LoadingSectionProps) => (
  <div className={styles.loadingSection} style={{ minHeight: height }}>
    <LoadingContent message={message} />
  </div>
);

interface LoadingOverlayCustomProps {
  visible: boolean;
  blur?: number;
}

export const LoadingOverlayCustom = ({
  visible,
  blur = 2,
  ...props
}: LoadingOverlayCustomProps) => (
  <LoadingOverlay
    visible={visible}
    zIndex={1000}
    overlayProps={{ blur }}
    loaderProps={{
      color: 'var(--color-primary)',
      size: 'lg',
    }}
    {...props}
  />
);

interface LoadingSkeletonProps {
  lines?: number;
  height?: number;
}

export const LoadingSkeleton = ({ lines = 3, height = 10, ...props }: LoadingSkeletonProps) => (
  <Stack gap='xs'>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton key={index} height={height} radius='md' {...props} />
    ))}
  </Stack>
);

export const LoadingCard = () => (
  <div className={styles.loadingCard}>
    <Skeleton height={60} circle mb='sm' />
    <Skeleton height={8} radius='md' />
    <Skeleton height={8} mt={6} radius='md' />
    <Skeleton height={8} mt={6} width='70%' radius='md' />
  </div>
);

interface LoadingTableRowProps {
  columns?: number;
}

export const LoadingTableRow = ({ columns = 4 }: LoadingTableRowProps) => (
  <tr>
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index}>
        <Skeleton height={8} radius='md' />
      </td>
    ))}
  </tr>
);

interface LoadingPageProps {
  message?: string;
}

export const LoadingPage = ({ message = 'Loading page...' }: LoadingPageProps) => (
  <div className={styles.loadingPage}>
    <LoadingContent message={message} size='lg' />
  </div>
);

export const ButtonLoader = () => <LoadingSpinner size='xs' color='currentColor' />;

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
