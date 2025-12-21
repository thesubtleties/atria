import { useEffect } from 'react';
import { Modal, Select, Stack, Text, Alert, List } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  roleUpdateSchema,
  getRoleDisplayName,
  canChangeUserRole,
} from '../schemas/attendeeSchemas';
import type { EventUserRoleType, RoleUpdateFormData } from '../schemas/attendeeSchemas';
import { useUpdateEventUserMutation } from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import { cn } from '@/lib/cn';
import type { EventUser, ApiError } from '@/types';
import styles from './styles.module.css';

type RoleUpdateModalProps = {
  opened: boolean;
  onClose: () => void;
  user: EventUser | null;
  eventId: number | undefined;
  currentUserRole: EventUserRoleType;
  currentUserId: number | undefined;
  adminCount: number;
  onSuccess?: () => void;
};

const RoleUpdateModal = ({
  opened,
  onClose,
  user,
  eventId,
  currentUserRole,
  currentUserId,
  adminCount,
  onSuccess,
}: RoleUpdateModalProps) => {
  const [updateUser, { isLoading }] = useUpdateEventUserMutation();

  const form = useForm<RoleUpdateFormData>({
    validate: zodResolver(roleUpdateSchema),
    initialValues: {
      role: (user?.role as EventUserRoleType) || 'ATTENDEE',
    },
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      form.reset();
      form.setFieldValue('role', user.role as EventUserRoleType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user, not form (form object changes on every render)

  const handleSubmit = async (values: RoleUpdateFormData) => {
    if (!user || !eventId) return;

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
      const apiError = error as ApiError;
      notifications.show({
        title: 'Error',
        message: apiError.data?.message || 'Failed to update role',
        color: 'red',
      });
    }
  };

  // Build role options based on what changes are allowed
  const roleOptions = (['ATTENDEE', 'SPEAKER', 'ORGANIZER', 'ADMIN'] as EventUserRoleType[])
    .map((role) => {
      const validation = canChangeUserRole(
        currentUserRole,
        currentUserId!,
        user?.user_id ?? 0,
        (user?.role as EventUserRoleType) ?? 'ATTENDEE',
        role,
        adminCount,
      );
      return {
        value: role,
        label: getRoleDisplayName(role),
        disabled: !validation.allowed,
      };
    })
    .filter((option) => !option.disabled);

  if (!user) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Update User Role'
      size='md'
      lockScroll={false}
      classNames={{
        content: styles.modalContent ?? '',
        header: styles.modalHeader ?? '',
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <div className={cn(styles.userInfo)}>
            <h3 className={cn(styles.userName)}>{user.full_name}</h3>
            <p className={cn(styles.userEmail)}>{user.email}</p>
          </div>

          <Select
            label='New Role'
            data={roleOptions}
            required
            className={cn(styles.formSelect)}
            {...form.getInputProps('role')}
          />

          {/* Warning for speaker being downgraded to attendee */}
          {user?.role === 'SPEAKER' && form.values.role === 'ATTENDEE' && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color='red'
              className={cn(styles.dangerAlert)}
            >
              <Text size='sm' fw={500}>
                Warning: Downgrading to Attendee
              </Text>
              <Text size='sm' mt='xs'>
                This user will be automatically removed from all sessions they are assigned to speak
                at. This action cannot be undone automatically.
              </Text>
            </Alert>
          )}

          {/* Info for speaker being upgraded to organizer/admin */}
          {user?.role === 'SPEAKER' && ['ORGANIZER', 'ADMIN'].includes(form.values.role) && (
            <Alert icon={<IconAlertCircle size={16} />} className={cn(styles.infoAlert)}>
              <Text size='sm' fw={500}>
                Note: Upgrading from Speaker
              </Text>
              <Text size='sm' mt='xs'>
                {`This user will retain their speaker assignments to any
                  sessions. If you want to remove them from sessions, you'll
                  need to do so manually from the Sessions Manager.`}
              </Text>
            </Alert>
          )}

          {/* Info for organizer/admin being changed to speaker */}
          {['ORGANIZER', 'ADMIN'].includes(user?.role ?? '') && form.values.role === 'SPEAKER' && (
            <Alert icon={<IconAlertCircle size={16} />} className={cn(styles.infoAlert)}>
              <Text size='sm' fw={500}>
                Note: Changing to Speaker Role
              </Text>
              <Text size='sm' mt='xs'>
                This user can be assigned to sessions after this change. They will lose their
                administrative permissions but can be upgraded back later if needed.
              </Text>
            </Alert>
          )}

          {currentUserRole === 'ORGANIZER' && (
            <Alert icon={<IconAlertCircle size={16} />} className={cn(styles.warningAlert)}>
              <Text size='sm'>
                As an organizer, you can only change between attendee and speaker roles. You cannot
                create other organizers or admins.
              </Text>
            </Alert>
          )}

          {form.values.role === 'SPEAKER' && user.role !== 'SPEAKER' && (
            <Alert icon={<IconAlertCircle size={16} />} className={cn(styles.infoAlert)}>
              <Stack gap='xs'>
                <Text size='sm' fw={500}>
                  Speaker Role Privileges:
                </Text>
                <List
                  size='sm'
                  spacing='xs'
                  icon={<IconCheck size={16} stroke={3} />}
                  className={cn(styles.privilegesList)}
                  styles={{
                    itemIcon: { marginTop: 2 },
                  }}
                >
                  <List.Item>Be assigned to sessions</List.Item>
                  <List.Item>Access speaker-only chat rooms</List.Item>
                  <List.Item>Have their profile featured on the speakers page</List.Item>
                </List>
              </Stack>
            </Alert>
          )}

          {form.values.role === 'ORGANIZER' && user.role !== 'ORGANIZER' && (
            <Alert icon={<IconAlertCircle size={16} />} className={cn(styles.warningAlert)}>
              <Stack gap='xs'>
                <Text size='sm' fw={500}>
                  Organizer Role Permissions:
                </Text>
                <List
                  size='sm'
                  spacing='xs'
                  icon={<IconCheck size={16} stroke={3} />}
                  className={cn(styles.privilegesList)}
                  styles={{
                    itemIcon: { marginTop: 2 },
                  }}
                >
                  <List.Item>Manage event settings and details</List.Item>
                  <List.Item>Add and remove attendees</List.Item>
                  <List.Item>Assign speaker and attendee roles</List.Item>
                  <List.Item>Create and manage sessions</List.Item>
                  <List.Item>Send event invitations</List.Item>
                </List>
                <Text size='xs' c='dimmed' mt='xs'>
                  Note: Organizers cannot assign Admin roles or delete the event.
                </Text>
              </Stack>
            </Alert>
          )}

          {form.values.role === 'ADMIN' && (
            <Alert icon={<IconAlertCircle size={16} />} className={cn(styles.dangerAlert)}>
              <Text size='sm' fw={500}>
                Warning: Admin users have full control over the event, including the ability to
                delete it. Only grant this role to trusted users.
              </Text>
            </Alert>
          )}

          <div className={cn(styles.buttonGroup)}>
            <Button variant='secondary' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' variant='primary' disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </Stack>
      </form>
    </Modal>
  );
};

export default RoleUpdateModal;
