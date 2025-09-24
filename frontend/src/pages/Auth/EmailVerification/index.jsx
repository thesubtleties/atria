import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Stack, Title, Text, Button, Alert, Center } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useVerifyEmailQuery } from '@/app/features/auth/api';
import { LoadingContent } from '../../../shared/components/loading';
import styles from './styles/index.module.css';

export const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading } = useVerifyEmailQuery(token, {
    skip: !token,
  });

  useEffect(() => {
    if (data) {
      // Redirect to landing page after 3 seconds
      setTimeout(() => {
        navigate('/', { state: { emailVerified: true, message: 'Email verified successfully! You can now log in.' } });
      }, 3000);
    }
  }, [data, navigate]);

  return (
    <Container size="sm" className={styles.container}>
      <Paper radius="md" p="xl" className={styles.paper}>
        {isLoading && (
          <LoadingContent 
            message="Please wait while we verify your email address" 
            size="lg" 
          />
        )}

        {data && (
          <Stack align="center" gap="md" className={styles.success}>
            <Center className={styles.iconWrapper}>
              <IconCheck size={48} stroke={2} />
            </Center>
            <Title order={2}>Email Verified!</Title>
            <Text c="dimmed" ta="center">
              {`Your email has been successfully verified. You'll be redirected to the login page in a few seconds.`}
            </Text>
            <Button onClick={() => navigate('/', { state: { emailVerified: true, message: 'Email verified successfully! You can now log in.' } })} variant="filled">
              Go to Login
            </Button>
          </Stack>
        )}

        {error && (
          <Stack align="center" gap="md" className={styles.error}>
            <Center className={styles.iconWrapper}>
              <IconX size={48} stroke={2} />
            </Center>
            <Title order={2}>Verification Failed</Title>
            <Alert color="red" variant="light" className={styles.alert}>
              {error.data?.message || 'Invalid or expired verification link'}
            </Alert>
            <Text c="dimmed" ta="center" size="sm">
              If your verification link has expired, you can request a new one by signing up again.
            </Text>
            <Button onClick={() => navigate('/signup')} variant="light">
              Back to Sign Up
            </Button>
          </Stack>
        )}
      </Paper>
    </Container>
  );
};