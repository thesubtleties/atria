import { Modal, Select, Button, Group, Stack, Text, Alert } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { roleUpdateSchema, getRoleDisplayName, canChangeRole } from '../schemas/attendeeSchemas';
import { useUpdateEventUserMutation } from '../../../../app/features/events/api';

const RoleUpdateModal = ({ opened, onClose, user, eventId, currentUserRole, onSuccess }) => {
  const [updateUser, { isLoading }] = useUpdateEventUserMutation();

  const form = useForm({
    resolver: zodResolver(roleUpdateSchema),
    initialValues: {
      role: user?.role || 'ATTENDEE',
    },
  });

  // Reset form when user changes
  if (user && form.values.role !== user.role) {
    form.setFieldValue('role', user.role);
  }

  const handleSubmit = async (values) => {
    if (!user) return;

    try {
      await updateUser({
        eventId,
        userId: user.user_id,
        role: values.role,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `${user.full_name}'s role updated to ${getRoleDisplayName(values.role)}`,
        color: 'green',
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update role',
        color: 'red',
      });
    }
  };

  const roleOptions = ['ATTENDEE', 'SPEAKER', 'ORGANIZER', 'ADMIN']
    .filter((role) => canChangeRole(currentUserRole, role))
    .map((role) => ({
      value: role,
      label: getRoleDisplayName(role),
      disabled: !canChangeRole(currentUserRole, role),
    }));

  if (!user) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Update User Role"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <div>
            <Text size="sm" c="dimmed">User</Text>
            <Text fw={500}>{user.full_name}</Text>
            <Text size="sm" c="dimmed">{user.email}</Text>
          </div>

          <Select
            label="New Role"
            data={roleOptions}
            required
            {...form.getInputProps('role')}
          />

          {currentUserRole === 'ORGANIZER' && (
            <Alert icon={<IconAlertCircle size={16} />} color="yellow">
              <Text size="sm">
                As an organizer, you can only assign roles lower than your own.
                You cannot create other organizers or admins.
              </Text>
            </Alert>
          )}

          {form.values.role === 'SPEAKER' && user.role !== 'SPEAKER' && (
            <Alert icon={<IconAlertCircle size={16} />} color="blue">
              <Text size="sm">
                When assigning the Speaker role, the user will be able to:
                - Be assigned to sessions
                - Access speaker-only chat rooms
                - Have their profile featured on the speakers page
              </Text>
            </Alert>
          )}

          {form.values.role === 'ADMIN' && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              <Text size="sm" fw={500}>
                Warning: Admin users have full control over the event, including
                the ability to delete it. Only grant this role to trusted users.
              </Text>
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Update Role
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default RoleUpdateModal;