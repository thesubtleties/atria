import { Box, Text } from '@mantine/core';
import styles from './styles/index.module.css';

const SponsorsEmptyState = () => {
  return (
    <Box className={styles.emptyState}>
      <Text c="dimmed" ta="center">
        {`No sponsors added yet. Click "Add Sponsor" to get started.`}
      </Text>
    </Box>
  );
};

export default SponsorsEmptyState;