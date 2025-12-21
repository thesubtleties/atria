import { useState, useEffect, useMemo } from 'react';
import {
  LoadingOverlay,
  Center,
  Text,
  Pagination,
  Modal,
  Select,
  Stack,
  Group,
} from '@mantine/core';
import {
  useGetOrganizationUsersQuery,
  useUpdateOrganizationUserMutation,
  useRemoveOrganizationUserMutation,
} from '@/app/features/organizations/api';
import { notifications } from '@mantine/notifications';
import { Button } from '@/shared/components/buttons';
import MemberRow from '../MemberRow';
import MemberCard from '../MemberCard';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { OrganizationUserRole, ApiError } from '@/types';

type Member = {
  user_id: number;
  user_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  image_url?: string;
  role: string;
  is_current_user?: boolean;
  created_at?: string;
};

type MembersListProps = {
  orgId?: string | undefined;
  searchQuery: string;
  roleFilter: string;
  currentUserRole: OrganizationUserRole;
};

type OrganizationUsersResponse = {
  organization_users?: Member[];
  total_pages?: number;
};

const MembersList = ({ orgId, searchQuery, roleFilter, currentUserRole }: MembersListProps) => {
  const [page, setPage] = useState(1);
  const [roleModalOpened, setRoleModalOpened] = useState(false);
  const [removeModalOpened, setRemoveModalOpened] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>('');
  const perPage = 20;

  const parsedOrgId = orgId ? parseInt(orgId) : 0;
  const roleParam = roleFilter === 'all' ? undefined : (roleFilter as OrganizationUserRole);

  const queryParams =
    roleParam ?
      { orgId: parsedOrgId, page, per_page: perPage, role: roleParam }
    : { orgId: parsedOrgId, page, per_page: perPage };

  const { data, isLoading, error } = useGetOrganizationUsersQuery(queryParams, { skip: !orgId });

  const typedData = data as OrganizationUsersResponse | undefined;

  const [updateRole, { isLoading: isUpdating }] = useUpdateOrganizationUserMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveOrganizationUserMutation();

  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter]);

  const handleRoleUpdate = (member: Member) => {
    setSelectedMember(member);
    setSelectedRole(member.role);
    setRoleModalOpened(true);
  };

  const handleRemove = (member: Member) => {
    setSelectedMember(member);
    setRemoveModalOpened(true);
  };

  const submitRoleUpdate = async () => {
    if (!selectedMember || selectedRole === selectedMember.role) {
      setRoleModalOpened(false);
      return;
    }

    try {
      await updateRole({
        orgId: orgId ? parseInt(orgId) : 0,
        userId: selectedMember.user_id,
        role: selectedRole as OrganizationUserRole,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Updated ${selectedMember.user_name}'s role to ${selectedRole}`,
        color: 'green',
      });
      setRoleModalOpened(false);
    } catch (err) {
      const apiError = err as ApiError;
      notifications.show({
        title: 'Error',
        message: apiError.data?.message || 'Failed to update member role',
        color: 'red',
      });
    }
  };

  const submitRemove = async () => {
    if (!selectedMember) return;

    try {
      await removeMember({
        orgId: orgId ? parseInt(orgId) : 0,
        userId: selectedMember.user_id,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Removed ${selectedMember.user_name} from the organization`,
        color: 'green',
      });
      setRemoveModalOpened(false);
    } catch (err) {
      const apiError = err as ApiError;
      notifications.show({
        title: 'Error',
        message: apiError.data?.message || 'Failed to remove member',
        color: 'red',
      });
    }
  };

  const filteredMembers = useMemo(() => {
    if (!typedData?.organization_users) return [];

    if (!searchQuery) return typedData.organization_users;

    const query = searchQuery.toLowerCase();
    return typedData.organization_users.filter(
      (member) =>
        member.user_name?.toLowerCase().includes(query) ||
        member.first_name?.toLowerCase().includes(query) ||
        member.last_name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query),
    );
  }, [typedData?.organization_users, searchQuery]);

  const roleOptions = [
    { value: 'MEMBER', label: 'Member' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  if (currentUserRole === 'OWNER') {
    roleOptions.push({ value: 'OWNER', label: 'Owner' });
  }

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error) {
    return (
      <Center className={cn(styles.emptyState)}>
        <Text c='red'>Failed to load members</Text>
      </Center>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <Center className={cn(styles.emptyState)}>
        <div className={cn(styles.emptyContent)}>
          <Text size='lg' fw={500} c='dimmed'>
            {searchQuery ? 'No members found matching your search' : 'No members yet'}
          </Text>
          {!searchQuery && (
            <Text size='sm' c='dimmed' mt='xs'>
              Invite members to start collaborating
            </Text>
          )}
        </div>
      </Center>
    );
  }

  return (
    <>
      <div className={cn(styles.membersList)}>
        {/* Desktop Table View */}
        <div className={cn(styles.tableContainer)}>
          <table className={cn(styles.membersTable)}>
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th className={cn(styles.centerColumn)}>Role</th>
                <th className={cn(styles.centerColumn)}>Joined</th>
                {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && (
                  <th className={cn(styles.centerColumn)}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <MemberRow
                  key={member.user_id}
                  member={member}
                  orgId={orgId ? parseInt(orgId) : undefined}
                  currentUserRole={currentUserRole}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className={cn(styles.memberCards)}>
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.user_id}
              member={member}
              currentUserRole={currentUserRole}
              onRoleUpdate={handleRoleUpdate}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {typedData?.total_pages && typedData.total_pages > 1 && (
          <div className={cn(styles.paginationWrapper)}>
            <Pagination
              value={page}
              onChange={setPage}
              total={typedData.total_pages}
              className={cn(styles.pagination)}
            />
          </div>
        )}
      </div>

      <Modal
        opened={roleModalOpened}
        onClose={() => setRoleModalOpened(false)}
        title='Change Member Role'
        size='sm'
      >
        <Stack gap='md'>
          <Text size='sm'>
            Update role for <strong>{selectedMember?.user_name}</strong>
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
              onClick={submitRoleUpdate}
              loading={isUpdating}
              disabled={selectedRole === selectedMember?.role}
            >
              Update Role
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={removeModalOpened}
        onClose={() => setRemoveModalOpened(false)}
        title='Remove Member'
        size='sm'
      >
        <Stack gap='md'>
          <Text size='sm'>
            Are you sure you want to remove <strong>{selectedMember?.user_name}</strong> from the
            organization?
          </Text>

          <Text size='xs' c='dimmed'>
            They will lose access to all organization events and data.
          </Text>

          <Group justify='flex-end' mt='md'>
            <Button variant='secondary' onClick={() => setRemoveModalOpened(false)}>
              Cancel
            </Button>
            <Button variant='danger' onClick={submitRemove} loading={isRemoving}>
              Remove Member
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default MembersList;
