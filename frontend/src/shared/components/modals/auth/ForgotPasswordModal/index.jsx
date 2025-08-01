import { useState } from 'react';
import { TextInput, Button, Stack, Alert, Text } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconMail } from '@tabler/icons-react';
import { useForgotPasswordMutation } from '@/app/features/auth/api';
import { forgotPasswordSchema } from './schemas/forgotPasswordSchema';
import styles from './styles/index.module.css';

export const ForgotPasswordModal = ({ onClose }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: zodResolver(forgotPasswordSchema),
  });

  const handleSubmit = async (values) => {
    try {
      await forgotPassword(values.email).unwrap();
      setIsSuccess(true);
    } catch (error) {
      form.setErrors({ email: 'An error occurred. Please try again.' });
    }
  };

  if (isSuccess) {
    return (
      <Stack gap="md" className={styles.successMessage}>
        <IconMail size={48} color="var(--mantine-color-blue-6)" style={{ alignSelf: 'center' }} />
        <Text size="lg" fw={600} ta="center">Check Your Email</Text>
        <Alert color="blue" variant="light">
          If an account exists with the email you provided, we've sent password reset instructions to your inbox.
        </Alert>
        <Text size="sm" c="dimmed" ta="center">
          The reset link will expire in 1 hour. If you don't receive an email, please check your spam folder.
        </Text>
        <Button variant="light" onClick={onClose} fullWidth>
          Close
        </Button>
      </Stack>
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
      <Stack gap="md">
        <div>
          <Text size="lg" fw={600}>Forgot your password?</Text>
          <Text size="sm" c="dimmed" mt="xs">
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
        </div>

        <TextInput
          label="Email"
          placeholder="your@email.com"
          {...form.getInputProps('email')}
          disabled={isLoading}
          autoFocus
        />

        <Stack gap="xs">
          <Button type="submit" loading={isLoading} fullWidth>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <Button variant="subtle" onClick={onClose} fullWidth disabled={isLoading}>
            Back to Login
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};