import { useState } from 'react';
import { Text, Stack, Group } from '@mantine/core';
import { modals } from '@mantine/modals';
import { Button } from '../../buttons';
import styles from './styles/index.module.css';

export const openConfirmationModal = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = true,
  children,
}) => {
  // Create a unique modal ID
  const modalId = `confirmation-modal-${Date.now()}`;
  
  // Custom modal component
  const ConfirmationModalContent = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
      setIsLoading(true);
      try {
        await onConfirm();
        modals.close(modalId);
      } catch (error) {
        console.error('Confirmation action failed:', error);
        setIsLoading(false);
      }
    };

    const handleCancel = () => {
      if (onCancel) {
        onCancel();
      }
      modals.close(modalId);
    };

    return (
      <Stack spacing="md">
        {children || (
          <Text size="sm" className={styles.message}>
            {message}
          </Text>
        )}
        <Group justify="flex-end" className={styles.buttonGroup}>
          <Button 
            variant="subtle" 
            onClick={handleCancel} 
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDangerous ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </Group>
      </Stack>
    );
  };

  // Open the modal using Mantine's modals manager
  modals.open({
    modalId,
    title,
    size: 'md',
    centered: true,
    closeOnClickOutside: false,
    closeOnEscape: true,
    classNames: {
      content: styles.modalContent,
      header: styles.modalHeader,
      body: styles.modalBody,
      overlay: styles.modalOverlay,
    },
    children: <ConfirmationModalContent />,
  });
};

export default openConfirmationModal;