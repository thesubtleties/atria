import { Modal, Text, Alert, Stack, Group } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Button } from '../../../../shared/components/buttons';
import styles from './styles/index.module.css';

export function DeleteMessageModal({ opened, onClose, message, onConfirm, isLoading }) {
  if (!message) return null;

  const messageUser = message.user || message.sender;
  const fullName = messageUser?.full_name || messageUser?.fullName || 
                   `${messageUser?.first_name || messageUser?.firstName || ''} ${messageUser?.last_name || messageUser?.lastName || ''}`.trim() || 
                   'Anonymous';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Message"
      size="sm"
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
      }}
    >
      <Stack spacing="md">
        <Alert 
          icon={<IconAlertTriangle size={16} />} 
          className={styles.dangerAlert}
        >
          <Text size="sm">
            Are you sure you want to delete this message? This action cannot be undone.
          </Text>
        </Alert>

        <div className={styles.messagePreview}>
          <Text size="sm" fw={500} c="#1E293B">
            {fullName}
          </Text>
          <Text size="sm" className={styles.messageContent}>
            {message.content}
          </Text>
        </div>

        <Group justify="flex-end" className={styles.buttonGroup}>
          <Button variant="subtle" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="danger"
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Message'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}