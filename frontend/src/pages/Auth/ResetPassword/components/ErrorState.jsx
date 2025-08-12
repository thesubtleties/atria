import { Stack, Title, Text, Alert } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/buttons';
import styles from '../styles/index.module.css';

const ErrorState = () => {
  const navigate = useNavigate();
  
  return (
    <section className={styles.errorSection}>
      <Stack align="center" gap="md" className={styles.error}>
        <div className={styles.iconWrapper}>
          <IconX size={48} stroke={2} />
        </div>
        <Title order={2} className={styles.errorTitle}>
          Invalid Reset Link
        </Title>
        <Alert color="red" variant="light" className={styles.errorAlert}>
          This password reset link is invalid or has expired.
        </Alert>
        <Text c="dimmed" ta="center" size="sm">
          Password reset links expire after 1 hour. Please request a new one.
        </Text>
        <Button onClick={() => navigate('/')} variant="secondary">
          Back to Home
        </Button>
      </Stack>
    </section>
  );
};

export default ErrorState;