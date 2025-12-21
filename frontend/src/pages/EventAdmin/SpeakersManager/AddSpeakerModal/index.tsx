import { useState } from 'react';
import { Modal, Select, Group, Stack, Text, Alert, Box } from '@mantine/core';
import { LoadingContent } from '@/shared/components/loading';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useGetEventUsersAdminQuery, useUpdateEventUserMutation } from '@/app/features/events/api';
import { IconInfoCircle, IconUserPlus } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons';
import type { EventUser } from '@/types';
import styles from './styles.module.css';

type AddSpeakerModalProps = {
  opened: boolean;
  onClose: () => void;
  eventId: number;
  onSuccess?: () => void;
};

type UserOption = {
  value: string;
  label: string;
  email: string;
  role: string;
};

const AddSpeakerModal = ({ opened, onClose, eventId, onSuccess }: AddSpeakerModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [updateUser, { isLoading: isUpdating }] = useUpdateEventUserMutation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { data: usersData, isLoading } = useGetEventUsersAdminQuery(
    {
      eventId,
      per_page: 100,
    },
    {
      skip: !opened,
    },
  );

  const eventUsers = (usersData as { event_users?: EventUser[] })?.event_users ?? [];
  const availableUsers: UserOption[] =
    eventUsers
      .filter((user) => user.role !== 'SPEAKER')
      .map((user) => ({
        value: user.user_id.toString(),
        label: `${user.full_name} (${user.role})`,
        email: user.email,
        role: user.role,
      })) ?? [];

  const handleSubmit = async () => {
    if (!selectedUserId) {
      notifications.show({
        title: 'Error',
        message: 'Please select a user',
        color: 'red',
      });
      return;
    }

    try {
      await updateUser({
        eventId,
        userId: selectedUserId,
        role: 'SPEAKER',
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Speaker added successfully',
        color: 'green',
      });

      onSuccess?.();
    } catch (error) {
      const errorMessage =
        (
          error &&
          typeof error === 'object' &&
          'data' in error &&
          error.data &&
          typeof error.data === 'object' &&
          'message' in error.data
        ) ?
          String(error.data.message)
        : 'Failed to add speaker';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  const handleClose = () => {
    setSelectedUserId(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title='Add Speaker'
      size='md'
      centered
      lockScroll={false}
      classNames={{
        content: styles.modalContent ?? '',
        header: styles.modalHeader ?? '',
        body: styles.modalBody ?? '',
      }}
    >
      <Stack className={styles.formStack ?? ''}>
        <Alert
          icon={<IconInfoCircle size={14} />}
          color='blue'
          className={styles.infoAlert ?? ''}
          styles={{
            root: { padding: 'var(--space-sm) !important' },
            message: { fontSize: 'var(--text-xs) !important' },
          }}
        >
          <Text size='xs'>
            Select an attendee to make them a speaker.
            {!isMobile && ' Customize their info after adding.'}
          </Text>
        </Alert>

        {isLoading ?
          <Box p='xl' ta='center'>
            <LoadingContent message='Loading attendees...' />
          </Box>
        : availableUsers.length === 0 ?
          <Alert color='yellow' className={styles.warningAlert ?? ''}>
            <Text size='sm'>
              No non-speaker attendees found. Invite more people to your event first.
            </Text>
          </Alert>
        : <>
            <Select
              label='Select User'
              placeholder='Choose an attendee to make speaker'
              data={availableUsers}
              value={selectedUserId?.toString() ?? null}
              onChange={(value) => setSelectedUserId(value ? parseInt(value, 10) : null)}
              searchable
              nothingFoundMessage='No users found'
              required
              leftSection={<IconUserPlus size={16} />}
              className={styles.selectInput ?? ''}
              size='sm'
              classNames={{
                dropdown: styles.selectDropdown ?? '',
              }}
              renderOption={({ option }) => (
                <Group justify='space-between' wrap='nowrap'>
                  <div>
                    <Text size='xs'>{option.label}</Text>
                    <Text size='xs' c='dimmed'>
                      {(option as UserOption).email}
                    </Text>
                  </div>
                </Group>
              )}
            />
          </>
        }
      </Stack>

      {availableUsers.length > 0 && !isLoading && (
        <div className={styles.buttonGroup ?? ''}>
          <Button variant='subtle' onClick={handleClose}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleSubmit} disabled={!selectedUserId || isUpdating}>
            {isUpdating ? 'Adding...' : 'Add as Speaker'}
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default AddSpeakerModal;
