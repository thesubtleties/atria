import { useState, useEffect, useMemo } from 'react';
import { LoadingOverlay, Center, Text, Pagination, Modal, Select, Stack, Group } from '@mantine/core';
import { useGetOrganizationUsersQuery, useUpdateOrganizationUserMutation, useRemoveOrganizationUserMutation } from '../../../../../app/features/organizations/api';
import { notifications } from '@mantine/notifications';
import { Button } from '../../../../../shared/components/buttons';
import MemberRow from '../MemberRow';
import MemberCard from '../MemberCard';
import styles from './styles/index.module.css';

const MembersList = ({ orgId, searchQuery, roleFilter, currentUserRole }) => {
  const [page, setPage] = useState(1);
  const [roleModalOpened, setRoleModalOpened] = useState(false);
  const [removeModalOpened, setRemoveModalOpened] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const perPage = 20;

  const { data, isLoading, error } = useGetOrganizationUsersQuery({
    orgId,
    page,
    per_page: perPage,
    role: roleFilter === 'all' ? undefined : roleFilter,
  });

  const [updateRole, { isLoading: isUpdating }] = useUpdateOrganizationUserMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveOrganizationUserMutation();

  // Debug log to see the data structure
  useEffect(() => {
    if (data) {
      console.log('Organization Users Data:', data);
      console.log('First user:', data.organization_users?.[0]);
    }
  }, [data]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter]);

  // Handle role update
  const handleRoleUpdate = (member) => {
    setSelectedMember(member);
    setSelectedRole(member.role);
    setRoleModalOpened(true);
  };

  // Handle remove member
  const handleRemove = (member) => {
    setSelectedMember(member);
    setRemoveModalOpened(true);
  };

  // Submit role update
  const submitRoleUpdate = async () => {
    if (!selectedMember || selectedRole === selectedMember.role) {
      setRoleModalOpened(false);
      return;
    }

    try {
      await updateRole({
        orgId,
        userId: selectedMember.user_id,
        role: selectedRole,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Updated ${selectedMember.user_name}'s role to ${selectedRole}`,
        color: 'green',
      });
      setRoleModalOpened(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update member role',
        color: 'red',
      });
    }
  };

  // Submit remove member
  const submitRemove = async () => {
    if (!selectedMember) return;

    try {
      await removeMember({
        orgId,
        userId: selectedMember.user_id,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Removed ${selectedMember.user_name} from the organization`,
        color: 'green',
      });
      setRemoveModalOpened(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to remove member',
        color: 'red',
      });
    }
  };

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!data?.organization_users) return [];
    
    if (!searchQuery) return data.organization_users;

    const query = searchQuery.toLowerCase();
    return data.organization_users.filter(member => 
      member.user_name?.toLowerCase().includes(query) ||
      member.first_name?.toLowerCase().includes(query) ||
      member.last_name?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query)
    );
  }, [data?.organization_users, searchQuery]);

  // Role options for modal
  const roleOptions = [
    { value: 'MEMBER', label: 'Member' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  // Owners can also change to/from owner role
  if (currentUserRole === 'OWNER') {
    roleOptions.push({ value: 'OWNER', label: 'Owner' });
  }

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error) {
    return (
      <Center className={styles.emptyState}>
        <Text color="red">Failed to load members</Text>
      </Center>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <Center className={styles.emptyState}>
        <div className={styles.emptyContent}>
          <Text size="lg" weight={500} color="dimmed">
            {searchQuery ? 'No members found matching your search' : 'No members yet'}
          </Text>
          {!searchQuery && (
            <Text size="sm" color="dimmed" mt="xs">
              Invite members to start collaborating
            </Text>
          )}
        </div>
      </Center>
    );
  }

  return (
    <>
      <div className={styles.membersList}>
        {/* Desktop Table View */}
        <div className={styles.tableContainer}>
          <table className={styles.membersTable}>
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th className={styles.centerColumn}>Role</th>
                <th className={styles.centerColumn}>Joined</th>
                {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && (
                  <th className={styles.centerColumn}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <MemberRow
                  key={member.user_id}
                  member={member}
                  orgId={orgId}
                  currentUserRole={currentUserRole}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className={styles.memberCards}>
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

        {data?.total_pages > 1 && (
          <div className={styles.paginationWrapper}>
            <Pagination
              value={page}
              onChange={setPage}
              total={data.total_pages}
              className={styles.pagination}
            />
          </div>
        )}
      </div>

      {/* Role Update Modal */}
      <Modal
        opened={roleModalOpened}
        onClose={() => setRoleModalOpened(false)}
        title="Change Member Role"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Update role for <strong>{selectedMember?.user_name}</strong>
          </Text>
          
          <Select
            label="New Role"
            data={roleOptions}
            value={selectedRole}
            onChange={setSelectedRole}
            description="Admins can manage members and organization settings"
          />

          {selectedRole === 'OWNER' && (
            <Text size="xs" c="orange">
              Warning: Owners have full control over the organization
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setRoleModalOpened(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={submitRoleUpdate}
              loading={isUpdating}
              disabled={selectedRole === selectedMember?.role}
            >
              Update Role
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Remove Member Modal */}
      <Modal
        opened={removeModalOpened}
        onClose={() => setRemoveModalOpened(false)}
        title="Remove Member"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to remove <strong>{selectedMember?.user_name}</strong> from the organization?
          </Text>
          
          <Text size="xs" c="dimmed">
            They will lose access to all organization events and data.
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setRemoveModalOpened(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={submitRemove}
              loading={isRemoving}
            >
              Remove Member
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default MembersList;