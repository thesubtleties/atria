import { Button, Group } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { LoginModal } from '@/shared/components/modals/auth/LoginModal';
import { SignupModal } from '@/shared/components/modals/auth/SignupModal';
import { ForgotPasswordModal } from '@/shared/components/modals/auth/ForgotPasswordModal';
import styles from './styles/HeroActions.module.css';
import { useNavigate } from 'react-router-dom';

export const HeroActions = () => {
  const modals = useModals();
  const navigate = useNavigate();

  const handleForgotPassword = () => {
    modals.openModal({
      title: 'Reset Password',
      children: (
        <ForgotPasswordModal
          onClose={() => modals.closeAll()}
        />
      ),
      size: 'md',
      centered: true,
      closeOnClickOutside: true,
      closeOnEscape: true,
    });
  };

  const handleLogin = () => {
    modals.openModal({
      title: 'Log In',
      children: (
        <LoginModal
          onClose={() => modals.closeAll()}
          onSuccess={() => {
            modals.closeAll();
            navigate('/app');
          }}
          onForgotPassword={() => {
            modals.closeAll();
            handleForgotPassword();
          }}
        />
      ),
      size: 'md',
      centered: true,
      // Optional configurations
      closeOnClickOutside: true,
      closeOnEscape: true,
    });
  };

  const handleSignup = () => {
    modals.openModal({
      title: 'Create Account',
      children: (
        <SignupModal
          onClose={() => modals.closeAll()}
          onSuccess={() => {
            modals.closeAll();
            navigate('/app');
          }}
        />
      ),
      size: 'md',
      centered: true,
      closeOnClickOutside: true,
      closeOnEscape: true,
    });
  };

  return (
    <div className={styles.actionsWrapper}>
      <Group className={styles.buttonGroup} justify="center" gap="md">
        <Button
          className={styles.loginButton}
          variant="filled"
          onClick={handleLogin}
          size="lg"
        >
          Log In
        </Button>
        <Button
          className={styles.signupButton}
          variant="outline"
          onClick={handleSignup}
          size="lg"
        >
          Sign Up
        </Button>
      </Group>
    </div>
  );
};
