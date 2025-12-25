import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, zodResolver } from '@mantine/form';
import { useValidateResetTokenQuery, useResetPasswordMutation } from '@/app/features/auth/api';
import { resetPasswordSchema } from './schemas/resetPasswordSchema';
import type { ResetPasswordFormData } from './schemas/resetPasswordSchema';
import type { ApiError } from '@/types';

// Components
import PageLayout from './components/PageLayout';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import SuccessState from './components/SuccessState';
import ResetForm from './components/ResetForm';

type TokenData = {
  email: string;
};

export const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    data: tokenData,
    error: tokenError,
    isLoading: isValidating,
  } = useValidateResetTokenQuery(token as string, {
    skip: !token,
  });

  const [resetPassword, { isLoading: isSubmitting, error: resetError }] =
    useResetPasswordMutation();

  const form = useForm<ResetPasswordFormData>({
    initialValues: {
      password: '',
      password_confirm: '',
    },
    validate: zodResolver(resetPasswordSchema),
  });

  const handleSubmit = async (values: ResetPasswordFormData) => {
    if (!token) return;
    try {
      await resetPassword({
        token,
        password: values.password,
      }).unwrap();

      setShowSuccess(true);
      // Redirect to landing page after 3 seconds
      setTimeout(() => {
        navigate('/', {
          state: {
            passwordReset: true,
            message: 'Password reset successfully! You can now log in.',
          },
        });
      }, 3000);
    } catch {
      // Error is handled by RTK Query
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <PageLayout>
        <LoadingState />
      </PageLayout>
    );
  }

  // Error state
  if (tokenError) {
    return (
      <PageLayout>
        <ErrorState />
      </PageLayout>
    );
  }

  // Success state
  if (showSuccess) {
    return (
      <PageLayout>
        <SuccessState />
      </PageLayout>
    );
  }

  // Form state
  return (
    <PageLayout>
      <ResetForm
        form={form}
        onSubmit={handleSubmit}
        tokenData={tokenData as TokenData}
        isSubmitting={isSubmitting}
        resetError={resetError as ApiError | undefined}
      />
    </PageLayout>
  );
};
