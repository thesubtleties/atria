import { TextInput, PasswordInput, Button, Stack, Alert } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useLoginMutation } from '@/app/features/auth/api';
import { loginSchema } from './schemas/loginSchema';
import styles from './styles/index.module.css';
import { isConstructorDeclaration } from 'typescript';

export const LoginModal = ({ onClose, onSuccess }) => {
  const [login, { isLoading, error }] = useLoginMutation();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: zodResolver(loginSchema),
  });

  const handleSubmit = async (values) => {
    try {
      console.log(values);
      const result = await login(values).unwrap();

      // tokens are stored in the RTK Query Mutation

      onSuccess();
    } catch (error) {
      if (error.status === 401) {
        form.setErrors({ password: 'Invalid email or password' });
      } else {
        form.setErrors({ email: 'An unexpected error occurred' });
      }
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
      <Stack gap="md">
        <TextInput
          label="Email"
          placeholder="your@email.com"
          {...form.getInputProps('email')}
          disabled={isLoading}
        />

        <PasswordInput
          label="Password"
          placeholder="Your password"
          {...form.getInputProps('password')}
          disabled={isLoading}
        />

        <Button type="submit" loading={isLoading} fullWidth>
          {isLoading ? 'Logging in...' : 'Log in'}
        </Button>
      </Stack>
    </form>
  );
};
