import { TextInput, PasswordInput, Button, Stack } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { useSignupMutation, authApi } from '@/app/features/auth/api';
import { signupSchema } from './schemas/signupSchema';
import styles from './styles/index.module.css';

export const SignupModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [signup, { isLoading }] = useSignupMutation();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      password_confirm: '', // Add this field
      first_name: '',
      last_name: '',
    },
    validate: zodResolver(signupSchema),
  });

  const handleSubmit = async (values) => {
    try {
      // Remove password_confirm before sending to API
      const { password_confirm, ...submitData } = values;
      await signup(submitData).unwrap();

      const userData = await dispatch(
        authApi.endpoints.getCurrentUser.initiate()
      ).unwrap();
      if (userData) {
        onSuccess();
      }
    } catch (error) {
      if (error.status === 409) {
        form.setErrors({ email: 'Email already in use' });
      } else {
        form.setErrors({ email: 'An unexpected error occurred' });
      }
    }
  };

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

        <Button type="submit" loading={isLoading} fullWidth>
          {isLoading ? 'Creating account...' : 'Sign up'}
        </Button>
      </Stack>
    </form>
  );
};
