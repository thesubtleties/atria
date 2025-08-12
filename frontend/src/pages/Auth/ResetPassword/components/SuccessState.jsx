import { Stack, Title, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/buttons';
import styles from '../styles/index.module.css';

const SuccessState = () => {
  const navigate = useNavigate();
  
  return (
    <section className={styles.successSection}>
      <Stack align="center" gap="md" className={styles.success}>
        <div className={styles.iconWrapper}>
          <IconCheck size={48} stroke={2} />
        </div>
        <Title order={2} className={styles.successTitle}>
          Password Reset Successfully!
        </Title>
        <Text c="dimmed" ta="center">
          Your password has been reset. You&apos;ll be redirected to the
          login page in a few seconds.
        </Text>
        <Button
          onClick={() =>
            navigate('/', {
              state: {
                passwordReset: true,
                message: 'Password reset successfully! You can now log in.',
              },
            })
          }
          variant="primary"
        >
          Go to Login
        </Button>
      </Stack>
    </section>
  );
};

export default SuccessState;