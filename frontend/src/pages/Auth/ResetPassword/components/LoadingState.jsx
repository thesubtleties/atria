import { Stack, Text, Loader } from '@mantine/core';
import styles from '../styles/index.module.css';

const LoadingState = () => {
  return (
    <section className={styles.loadingSection}>
      <Stack align="center" gap="md">
        <Loader size="lg" color="#8b5cf6" />
        <Text c="dimmed">Validating reset link...</Text>
      </Stack>
    </section>
  );
};

export default LoadingState;