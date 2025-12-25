import { useState } from 'react';
import { Modal, Stack, Text, PasswordInput, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconAlertTriangle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Button } from '@/shared/components/buttons';
import { useDeleteEventMutation } from '@/app/features/events/api';
import { useVerifyPasswordMutation } from '@/app/features/auth/api';
import { cn } from '@/lib/cn';
import type { Event } from '@/types';
import styles from './styles.module.css';

type DeleteEventModalProps = {
  opened: boolean;
  onClose: () => void;
  event: Event | undefined;
  onSuccess?: () => void;
};

const DeleteEventModal = ({ opened, onClose, event, onSuccess }: DeleteEventModalProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();
  const [verifyPassword, { isLoading: isVerifying }] = useVerifyPasswordMutation();
  const navigate = useNavigate();

  const isLoading = isDeleting || isVerifying;

  const handleDelete = async () => {
    if (!password.trim()) {
      setError('Password is required to confirm deletion');
      return;
    }

    if (!event) return;

    setError('');

    try {
      // First verify the password
      await verifyPassword({ password: password.trim() }).unwrap();

      // If password is correct, delete the event
      await deleteEvent({ id: event.id }).unwrap();

      // Show success notification
      notifications.show({
        title: 'Event Deleted',
        message: `${event.title} has been permanently deleted`,
        color: 'red',
      });

      // Navigate to organization dashboard
      navigate(`/app/organizations/${event.organization_id}`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to delete event:', err);
      const apiError = err as { status?: number; data?: { message?: string } };

      if (apiError.status === 401 || apiError.data?.message?.includes('password')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(apiError.data?.message || 'Failed to delete event. Please try again.');
      }
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title='Confirm Event Deletion'
      size='md'
      centered
      closeOnClickOutside={false}
      closeOnEscape={!isLoading}
      classNames={{
        content: styles.modalContent ?? '',
        header: styles.modalHeader ?? '',
        body: styles.modalBody ?? '',
      }}
    >
      <Stack gap='lg'>
        <div className={cn(styles.dangerAlert)}>
          <div className={cn(styles.alertHeader)}>
            <IconAlertTriangle size={20} className={cn(styles.alertIcon)} />
            <Text fw={600} className={cn(styles.alertTitle)}>
              This action cannot be undone
            </Text>
          </div>
          <Text size='sm' className={cn(styles.alertText)}>
            You are about to permanently delete <strong>&quot;{event?.title}&quot;</strong>. This
            will remove all event data, attendees, sessions, and chat history.
          </Text>
        </div>

        <div className={cn(styles.eventInfo)}>
          <Text size='sm' c='dimmed'>
            Event to be deleted:
          </Text>
          <Text fw={600}>{event?.title}</Text>
          <Text size='xs' c='dimmed'>
            Organization:{' '}
            {(event as Event & { organization?: { name: string } })?.organization?.name ||
              event?.company_name}
          </Text>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.trim() && !isLoading) handleDelete();
          }}
        >
          <PasswordInput
            label='Enter your password to confirm'
            placeholder='Your account password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            error={error}
            autoFocus
            className={cn(styles.passwordInput)}
          />
        </form>

        <div className={cn(styles.buttonGroup)}>
          <Group justify='flex-end'>
            <Button variant='secondary' onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant='danger'
              onClick={handleDelete}
              disabled={isLoading || !password.trim()}
              loading={isLoading}
            >
              {isDeleting ?
                'Deleting...'
              : isVerifying ?
                'Verifying...'
              : 'Delete Event'}
            </Button>
          </Group>
        </div>
      </Stack>
    </Modal>
  );
};

export default DeleteEventModal;
