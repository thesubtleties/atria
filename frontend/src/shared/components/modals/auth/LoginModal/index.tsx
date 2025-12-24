import { TextInput, PasswordInput, Stack, Anchor } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { useLoginMutation, authApi } from '@/app/features/auth/api';
import { loginSchema } from './schemas/loginSchema';
import { Button } from '../../../../components/buttons';
import type { AppDispatch } from '@/app/store';
import styles from './styles/index.module.css';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

interface LoginFormValues {
  email: string;
  password: string;
}

interface ApiError {
  status?: number;
  data?: {
    message?: string;
  };
}

export const LoginModal = ({ onClose: _onClose, onSuccess, onForgotPassword }: LoginModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [login, { isLoading }] = useLoginMutation();

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: zodResolver(loginSchema),
  });

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      await login(values).unwrap();
      const userData = await dispatch(authApi.endpoints.getCurrentUser.initiate()).unwrap();
      if (userData) {
        onSuccess();
      }
    } catch (err: unknown) {
      const error = err as ApiError;
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
      className={styles.form || ''}
    >
      <Stack gap='md'>
        <TextInput
          label='Email'
          placeholder='your@email.com'
          {...form.getInputProps('email')}
          disabled={isLoading}
        />

        <PasswordInput
          label='Password'
          placeholder='Your password'
          {...form.getInputProps('password')}
          disabled={isLoading}
        />

        <Button type='submit' disabled={isLoading} className={styles.submitButton || ''}>
          {isLoading ? 'Logging in...' : 'Log in'}
        </Button>

        <div className={styles.actionsSection}>
          <div className={styles.forgotPasswordContainer}>
            <Anchor
              component='button'
              type='button'
              size='sm'
              onClick={onForgotPassword}
              className={styles.forgotPassword || ''}
              style={{ color: '#64748b', textDecoration: 'none' }}
            >
              Forgot password?
            </Anchor>
          </div>
        </div>
      </Stack>
    </form>
  );
};
