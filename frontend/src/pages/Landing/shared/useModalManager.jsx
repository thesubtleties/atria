import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@mantine/core';
import { LoginModal } from '@/shared/components/modals/auth/LoginModal';
import { SignupModal } from '@/shared/components/modals/auth/SignupModal';
import { ForgotPasswordModal } from '@/shared/components/modals/auth/ForgotPasswordModal';

/**
 * Modal manager hook - replaces @mantine/modals for landing page
 * Wraps modal content in Mantine Modal component for proper overlay rendering
 */
export const useModalManager = () => {
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();

  const openModal = useCallback((modalId) => {
    setActiveModal(modalId);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleForgotPassword = useCallback(() => {
    setActiveModal('forgotPassword');
  }, []);

  const handleLoginSuccess = useCallback(() => {
    closeModal();
    navigate('/app');
  }, [closeModal, navigate]);

  const handleSignupSuccess = useCallback(() => {
    closeModal();
    navigate('/app');
  }, [closeModal, navigate]);

  const ModalRenderer = useCallback(() => {
    return (
      <>
        <Modal
          opened={activeModal === 'login'}
          onClose={closeModal}
          title='Log In'
          centered
          size='md'
        >
          <LoginModal
            onClose={closeModal}
            onSuccess={handleLoginSuccess}
            onForgotPassword={handleForgotPassword}
          />
        </Modal>

        <Modal
          opened={activeModal === 'signup'}
          onClose={closeModal}
          title='Create Account'
          centered
          size='md'
        >
          <SignupModal onClose={closeModal} onSuccess={handleSignupSuccess} />
        </Modal>

        <Modal
          opened={activeModal === 'forgotPassword'}
          onClose={closeModal}
          title='Reset Password'
          centered
          size='md'
        >
          <ForgotPasswordModal onClose={closeModal} />
        </Modal>
      </>
    );
  }, [activeModal, closeModal, handleLoginSuccess, handleSignupSuccess, handleForgotPassword]);

  return {
    openModal,
    closeModal,
    ModalRenderer,
  };
};
