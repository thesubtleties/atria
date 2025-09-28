import { TextInput, PasswordInput, Stack, Alert, Title, Text } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useState } from 'react';
import { IconMail } from '@tabler/icons-react';
import { useSignupMutation } from '@/app/features/auth/api';
import { signupSchema } from './schemas/signupSchema';
import { Button } from '../../../../components/buttons';
import styles from './styles/index.module.css';

// onSuccess is passed by some parents but not currently used (signup requires email verification)
// eslint-disable-next-line no-unused-vars
export const SignupModal = ({ onClose, onSuccess }) => {
  const [signup, { isLoading }] = useSignupMutation();
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
    },
    validate: zodResolver(signupSchema),
  });

  const handleSubmit = async (values) => {
    try {
      // Remove password_confirm before sending to API
      // eslint-disable-next-line no-unused-vars
      const { password_confirm, ...submitData } = values;
      const response = await signup(submitData).unwrap();
      
      // Check if email verification is required
      if (response.requires_verification) {
        setUserEmail(values.email);
        setShowVerificationMessage(true);
      }
    } catch (error) {
      if (error.status === 400 && error.data?.message?.includes('Email already registered')) {
        form.setErrors({ email: 'Email already in use' });
      } else {
        form.setErrors({ email: 'An unexpected error occurred' });
      }
    }
  };

  // Show verification message after successful signup
  if (showVerificationMessage) {
    return (
      <Stack gap="md" className={styles.verificationMessage}>
        <IconMail size={48} color="var(--mantine-color-blue-6)" style={{ alignSelf: 'center' }} />
        <Title order={3} ta="center">Check Your Email</Title>
        <Text ta="center" c="dimmed">
          {"We've sent a verification email to "}<strong>{userEmail}</strong>
        </Text>
        <Alert color="blue" variant="light">
          Please check your inbox and click the verification link to activate your account.
          The link will expire in 24 hours.
        </Alert>
        <Text size="sm" c="dimmed" ta="center">
          {"Didn't receive the email? Check your spam folder or contact support."}
        </Text>
        <Button variant="subtle" onClick={onClose} className={styles.closeButton}>
          Close
        </Button>
      </Stack>
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
      <Stack gap="md">
        <TextInput
          label="First Name"
          placeholder="John"
          {...form.getInputProps('first_name')}
          disabled={isLoading}
        />

        <TextInput
          label="Last Name"
          placeholder="Doe"
          {...form.getInputProps('last_name')}
          disabled={isLoading}
        />

        <TextInput
          label="Email"
          placeholder="your@email.com"
          {...form.getInputProps('email')}
          disabled={isLoading}
        />

        <PasswordInput
          label="Password"
          placeholder="Create a password"
          {...form.getInputProps('password')}
          disabled={isLoading}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm your password"
          {...form.getInputProps('password_confirm')}
          disabled={isLoading}
        />

        <Button type="submit" disabled={isLoading} className={styles.submitButton}>
          {isLoading ? 'Creating account...' : 'Sign up'}
        </Button>
      </Stack>
    </form>
  );
};
