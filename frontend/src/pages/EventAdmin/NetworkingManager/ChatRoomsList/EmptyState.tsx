import { Box, Text } from '@mantine/core';
import { cn } from '@/lib/cn';
import styles from './styles.module.css';

const EmptyState = () => {
  return (
    <Box className={cn(styles.emptyState)}>
      <Text c='dimmed' ta='center'>
        {`No chat rooms configured. Click "Add Chat Room" to enable networking.`}
      </Text>
    </Box>
  );
};

export default EmptyState;
