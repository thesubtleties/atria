import { useState } from 'react';
import { Modal, Select, Button, Group, Stack, Text, Alert, Loader, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { 
  useGetEventUsersAdminQuery,
  useUpdateEventUserMutation,
} from '@/app/features/events/api';
import { IconInfoCircle, IconUserPlus } from '@tabler/icons-react';

const AddSpeakerModal = ({ opened, onClose, eventId, onSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [updateUser, { isLoading: isUpdating }] = useUpdateEventUserMutation();

  // Fetch non-speaker users
  const { data: usersData, isLoading } = useGetEventUsersAdminQuery(
    {
      eventId,
      per_page: 100, // Get more users for selection
    },
    {
      skip: !opened,
    }
  );

  // Filter out speakers and format for select
  const availableUsers = usersData?.event_users
    ?.filter(user => user.role !== 'SPEAKER')
    .map(user => ({
      value: user.user_id.toString(),
      label: `${user.full_name} (${user.role})`,
      email: user.email,
      role: user.role,
    })) || [];

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

      onSuccess();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to add speaker',
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
      title="Add Speaker"
      size="md"
    >
      <Stack>
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          <Text size="sm">
            Select an existing attendee or organizer to make them a speaker.
            You can customize their speaker title and bio after adding them.
          </Text>
        </Alert>

        {isLoading ? (
          <Box p="xl" ta="center">
            <Loader />
            <Text size="sm" c="dimmed" mt="md">Loading attendees...</Text>
          </Box>
        ) : availableUsers.length === 0 ? (
          <Alert color="yellow">
            <Text size="sm">
              No non-speaker attendees found. Invite more people to your event first.
            </Text>
          </Alert>
        ) : (
          <>
            <Select
              label="Select User"
              placeholder="Choose an attendee to make speaker"
              data={availableUsers}
              value={selectedUserId?.toString()}
              onChange={(value) => setSelectedUserId(value ? parseInt(value) : null)}
              searchable
              nothingFoundMessage="No users found"
              required
              leftSection={<IconUserPlus size={16} />}
              renderOption={({ option }) => (
                <Group justify="space-between" wrap="nowrap">
                  <div>
                    <Text size="sm">{option.label}</Text>
                    <Text size="xs" c="dimmed">{option.email}</Text>
                  </div>
                </Group>
              )}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                loading={isUpdating}
                disabled={!selectedUserId}
              >
                Add as Speaker
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default AddSpeakerModal;