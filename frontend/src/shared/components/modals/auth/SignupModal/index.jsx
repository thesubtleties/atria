import { TextInput, PasswordInput, Button, Stack } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useSignupMutation } from '@/app/features/auth/api';
import { signupSchema } from './schemas/signupSchema';
import styles from './styles/index.module.css';

export const SignupModal = ({ onClose, onSuccess }) => {
  const [signup, { isLoading }] = useSignupMutation();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
    },
    validate: zodResolver(signupSchema),
  });

  const handleSubmit = async (values) => {
    try {
      await signup(values).unwrap();
      // tokens are stored in RTK Query mutation
      onSuccess();
    } catch (error) {
      if (error.status === 409) {
        // If email already exists
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

        <Button type="submit" loading={isLoading} fullWidth>
          {isLoading ? 'Creating account...' : 'Sign up'}
        </Button>
      </Stack>
    </form>
  );
};
