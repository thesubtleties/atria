import { useState } from 'react';
import { Avatar, Group, Text, Badge, Menu, ActionIcon, Modal, Select, Stack } from '@mantine/core';
import { IconDots, IconUserEdit, IconUserX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useUpdateOrganizationUserMutation,
  useRemoveOrganizationUserMutation,
} from '@/app/features/organizations/api';
import { Button } from '@/shared/components/buttons';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { ApiError, OrganizationUserRole } from '@/types';

type Member = {
  user_id: number;
  user_name?: string;
  email?: string;
  image_url?: string;
  role: string;
  is_current_user?: boolean;
  created_at?: string;
};

type MemberRowProps = {
  member: Member;
  orgId?: number | undefined;
  currentUserRole: OrganizationUserRole;
};

const MemberRow = ({ member, orgId, currentUserRole }: MemberRowProps) => {
  const [roleModalOpened, setRoleModalOpened] = useState(false);
  const [removeModalOpened, setRemoveModalOpened] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(member.role);

  const [updateRole, { isLoading: isUpdating }] = useUpdateOrganizationUserMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveOrganizationUserMutation();

  const canManage =
    currentUserRole === 'OWNER' || (currentUserRole === 'ADMIN' && member.role !== 'OWNER');
  const isCurrentUser = member.is_current_user;

  const handleRoleUpdate = async () => {
    if (selectedRole === member.role) {
      setRoleModalOpened(false);
      return;
    }

    try {
      await updateRole({
        orgId: orgId ?? 0,
        userId: member.user_id,
        role: selectedRole as OrganizationUserRole,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Updated ${member.user_name}'s role to ${selectedRole}`,
        color: 'green',
      });
      setRoleModalOpened(false);
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update member role',
        color: 'red',
      });
    }
  };

  const handleRemove = async () => {
    try {
      await removeMember({
        orgId: orgId ?? 0,
        userId: member.user_id,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Removed ${member.user_name} from the organization`,
        color: 'green',
      });
      setRemoveModalOpened(false);
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to remove member',
        color: 'red',
      });
    }
  };

  const getInitials = (name?: string): string => {
    if (!name) return '?';

    if (name.includes('@')) {
      return (name[0] ?? '?').toUpperCase();
    }

    return name
      .split(' ')
      .map((n) => n[0] ?? '')
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const roleOptions = [
    { value: 'MEMBER', label: 'Member' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  if (currentUserRole === 'OWNER') {
    roleOptions.push({ value: 'OWNER', label: 'Owner' });
  }

  return (
    <>
      <tr className={cn(styles.memberRow)}>
        <td>
          <Group gap='sm'>
            <Avatar
              src={member.image_url ?? null}
              alt={member.user_name ?? 'User'}
              size='md'
              radius='xl'
              className={cn(styles.avatar)}
            >
              {getInitials(member.user_name)}
            </Avatar>
            <div>
              <Text size='sm' fw={500} className={cn(styles.memberName)}>
                {member.user_name || 'Unnamed User'}
                {isCurrentUser && (
                  <Text component='span' size='xs' c='dimmed'>
                    {' '}
                    (You)
                  </Text>
                )}
              </Text>
            </div>
          </Group>
        </td>
        <td>
          <Text size='sm' c='dimmed'>
            {member.email || 'No email'}
          </Text>
        </td>
        <td className={cn(styles.centerCell)}>
          <Badge variant='light' className={cn(styles.roleBadge)} data-role={member.role}>
            {member.role}
          </Badge>
        </td>
        <td className={cn(styles.centerCell)}>
          <Text size='sm' c='dimmed'>
            {member.created_at ?
              formatDistanceToNow(new Date(member.created_at), { addSuffix: true })
            : 'Unknown'}
          </Text>
        </td>
        {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && (
          <td className={cn(styles.centerCell)}>
            {canManage && !isCurrentUser && (
              <Menu position='bottom-end' withinPortal>
                <Menu.Target>
                  <ActionIcon variant='subtle' className={cn(styles.actionButton)}>
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconUserEdit size={14} />}
                    onClick={() => setRoleModalOpened(true)}
                  >
                    Change Role
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconUserX size={14} />}
                    color='red'
                    onClick={() => setRemoveModalOpened(true)}
                  >
                    Remove Member
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </td>
        )}
      </tr>

      <Modal
        opened={roleModalOpened}
        onClose={() => setRoleModalOpened(false)}
        title='Change Member Role'
        size='sm'
        lockScroll={false}
      >
        <Stack gap='md'>
          <Text size='sm'>
            Update role for <strong>{member.user_name}</strong>
          </Text>

          <Select
            label='New Role'
            data={roleOptions}
            value={selectedRole}
            onChange={setSelectedRole}
            description='Admins can manage members and organization settings'
          />

          {selectedRole === 'OWNER' && (
            <Text size='xs' c='orange'>
              Warning: Owners have full control over the organization
            </Text>
          )}

          <Group justify='flex-end' mt='md'>
            <Button variant='secondary' onClick={() => setRoleModalOpened(false)}>
              Cancel
            </Button>
            <Button
              variant='primary'
              onClick={handleRoleUpdate}
              disabled={isUpdating || selectedRole === member.role}
            >
              {isUpdating ? 'Updating...' : 'Update Role'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={removeModalOpened}
        onClose={() => setRemoveModalOpened(false)}
        title='Remove Member'
        size='sm'
        lockScroll={false}
      >
        <Stack gap='md'>
          <Text size='sm'>
            Are you sure you want to remove <strong>{member.user_name}</strong> from the
            organization?
          </Text>

          <Text size='xs' c='dimmed'>
            They will lose access to all organization events and data.
          </Text>

          <Group justify='flex-end' mt='md'>
            <Button variant='secondary' onClick={() => setRemoveModalOpened(false)}>
              Cancel
            </Button>
            <Button variant='danger' onClick={handleRemove} disabled={isRemoving}>
              {isRemoving ? 'Removing...' : 'Remove Member'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default MemberRow;
