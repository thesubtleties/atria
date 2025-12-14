import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, zodResolver } from '@mantine/form';
import { useValidateResetTokenQuery, useResetPasswordMutation } from '@/app/features/auth/api';
import { resetPasswordSchema } from './schemas/resetPasswordSchema';

// Components
import PageLayout from './components/PageLayout';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import SuccessState from './components/SuccessState';
import ResetForm from './components/ResetForm';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    data: tokenData,
    error: tokenError,
    isLoading: isValidating,
  } = useValidateResetTokenQuery(token, {
    skip: !token,
  });

  const [resetPassword, { isLoading: isSubmitting, error: resetError }] =
    useResetPasswordMutation();

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
        tokenData={tokenData}
        isSubmitting={isSubmitting}
        resetError={resetError}
      />
    </PageLayout>
  );
};
