import { useState } from 'react';
import { Text, Stack, Group } from '@mantine/core';
import { modals } from '@mantine/modals';
import { Button } from '../../buttons';
import styles from './styles/index.module.css';

type ConfirmationModalOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
  isDangerous?: boolean;
  children?: React.ReactNode;
};

export const openConfirmationModal = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = true,
  children,
}: ConfirmationModalOptions) => {
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
      <Stack gap='md'>
        {children || (
          <Text size='sm' className={styles.message || ''}>
            {message}
          </Text>
        )}
        <Group justify='flex-end' className={styles.buttonGroup || ''}>
          <Button variant='secondary' onClick={handleCancel} disabled={isLoading}>
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
      content: styles.modalContent || '',
      header: styles.modalHeader || '',
      body: styles.modalBody || '',
      overlay: styles.modalOverlay || '',
    },
    children: <ConfirmationModalContent />,
  });
};

export default openConfirmationModal;
