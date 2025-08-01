import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Stack, Title, Text, Button, Alert, Loader, PasswordInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useValidateResetTokenQuery, useResetPasswordMutation } from '@/app/features/auth/api';
import { resetPasswordSchema } from './schemas/resetPasswordSchema';
import styles from './styles/index.module.css';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const { data: tokenData, error: tokenError, isLoading: isValidating } = useValidateResetTokenQuery(token, {
    skip: !token,
  });
  const [resetPassword, { isLoading: isSubmitting, error: resetError }] = useResetPasswordMutation();

  const form = useForm({
    initialValues: {
      password: '',
      password_confirm: '',
    },
    validate: zodResolver(resetPasswordSchema),
  });

  const handleSubmit = async (values) => {
    try {
      await resetPassword({
        token,
        password: values.password,
      }).unwrap();
      
      setShowSuccess(true);
      // Redirect to landing page after 3 seconds
      setTimeout(() => {
        navigate('/', { state: { passwordReset: true, message: 'Password reset successfully! You can now log in.' } });
      }, 3000);
    } catch (error) {
      // Error is handled by RTK Query
    }
  };

  if (isValidating) {
    return (
      <Container size="sm" className={styles.container}>
        <Paper radius="md" p="xl" className={styles.paper}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Validating reset link...</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (tokenError) {
    return (
      <Container size="sm" className={styles.container}>
        <Paper radius="md" p="xl" className={styles.paper}>
          <Stack align="center" gap="md" className={styles.error}>
            <div className={styles.iconWrapper}>
              <IconX size={48} stroke={2} />
            </div>
            <Title order={2}>Invalid Reset Link</Title>
            <Alert color="red" variant="light" className={styles.alert}>
              This password reset link is invalid or has expired.
            </Alert>
            <Text c="dimmed" ta="center" size="sm">
              Password reset links expire after 1 hour. Please request a new one.
            </Text>
            <Button onClick={() => navigate('/')} variant="light">
              Back to Home
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (showSuccess) {
    return (
      <Container size="sm" className={styles.container}>
        <Paper radius="md" p="xl" className={styles.paper}>
          <Stack align="center" gap="md" className={styles.success}>
            <div className={styles.iconWrapper}>
              <IconCheck size={48} stroke={2} />
            </div>
            <Title order={2}>Password Reset Successfully!</Title>
            <Text c="dimmed" ta="center">
              Your password has been reset. You'll be redirected to the login page in a few seconds.
            </Text>
            <Button onClick={() => navigate('/', { state: { passwordReset: true, message: 'Password reset successfully! You can now log in.' } })} variant="filled">
              Go to Login
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="sm" className={styles.container}>
      <Paper radius="md" p="xl" className={styles.paper}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <div>
              <Title order={2}>Reset Your Password</Title>
              <Text c="dimmed" size="sm" mt="xs">
                Enter a new password for {tokenData?.email}
              </Text>
            </div>

            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              {...form.getInputProps('password')}
              disabled={isSubmitting}
              autoFocus
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm new password"
              {...form.getInputProps('password_confirm')}
              disabled={isSubmitting}
            />

            <Button type="submit" loading={isSubmitting} fullWidth>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>

            {resetError && (
              <Alert color="red" variant="light">
                An error occurred while resetting your password. Please try again.
              </Alert>
            )}
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};