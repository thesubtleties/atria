import { TextInput, PasswordInput, Stack, Anchor } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { useLoginMutation, authApi } from '@/app/features/auth/api';
import { loginSchema } from './schemas/loginSchema';
import { setUser } from '@/app/store/authSlice';
import { Button } from '../../../../components/buttons';
import styles from './styles/index.module.css';

export const LoginModal = ({ onClose, onSuccess, onForgotPassword }) => {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: zodResolver(loginSchema),
  });

  const handleSubmit = async (values) => {
    try {
      await login(values).unwrap();
      const userData = await dispatch(
        authApi.endpoints.getCurrentUser.initiate()
      ).unwrap();
      if (userData) {
        onSuccess();
      }
    } catch (error) {
      if (error.status === 400 && error.data?.message?.includes('Email not verified')) {
        form.setErrors({ email: 'Please verify your email before logging in' });
      } else if (error.status === 401 || error.status === 400) {
        form.setErrors({ password: 'Invalid email or password' });
      } else {
        form.setErrors({ email: 'An unexpected error occurred' });
      }
    }
  };


  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.onSubmit(handleSubmit)(e);
      }}
      className={styles.form}
    >
      <Stack gap="md">
        <TextInput
          label="Email"
          placeholder="your@email.com"
          {...form.getInputProps('email')}
          disabled={isLoading}
        />

        <div>
          <PasswordInput
            label="Password"
            placeholder="Your password"
            {...form.getInputProps('password')}
            disabled={isLoading}
          />
          <Anchor
            component="button"
            type="button"
            size="sm"
            onClick={onForgotPassword}
            className={styles.forgotPassword}
          >
            Forgot password?
          </Anchor>
        </div>

        <Button type="submit" disabled={isLoading} className={styles.submitButton}>
          {isLoading ? 'Logging in...' : 'Log in'}
        </Button>
      </Stack>
    </form>
  );
};
