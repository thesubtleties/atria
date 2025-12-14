import { Stack, Title, Text, Alert, PasswordInput } from '@mantine/core';
import { Button } from '@/shared/components/buttons';
import styles from '../styles/index.module.css';

const ResetForm = ({ form, onSubmit, tokenData, isSubmitting, resetError }) => {
  return (
    <section className={styles.mainContent}>
      <form onSubmit={form.onSubmit(onSubmit)} className={styles.formContainer}>
        <Stack gap='lg'>
          <div className={styles.headerSection}>
            <Title order={2} className={styles.pageTitle}>
              Reset Your Password
            </Title>
            <Text c='dimmed' size='sm' className={styles.emailText}>
              Enter a new password for {tokenData?.email}
            </Text>
          </div>

          <div className={styles.formFields}>
            <PasswordInput
              label='New Password'
              placeholder='Enter new password'
              {...form.getInputProps('password')}
              disabled={isSubmitting}
              autoFocus
              className={styles.passwordInput}
            />

            <PasswordInput
              label='Confirm Password'
              placeholder='Confirm new password'
              {...form.getInputProps('password_confirm')}
              disabled={isSubmitting}
              className={styles.passwordInput}
            />
          </div>

          <Button type='submit' disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>

          {resetError && (
            <Alert color='red' variant='light' className={styles.errorAlert}>
              An error occurred while resetting your password. Please try again.
            </Alert>
          )}
        </Stack>
      </form>
    </section>
  );
};

export default ResetForm;
