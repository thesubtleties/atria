import { useState, useEffect, useMemo } from 'react';
import { LoadingOverlay, Center, Text, Pagination } from '@mantine/core';
import { useGetOrganizationUsersQuery } from '../../../../../app/features/organizations/api';
import MemberRow from '../MemberRow';
import styles from './styles/index.module.css';

const MembersList = ({ orgId, searchQuery, roleFilter, currentUserRole }) => {
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading, error } = useGetOrganizationUsersQuery({
    orgId,
    page,
    per_page: perPage,
    role: roleFilter === 'all' ? undefined : roleFilter,
  });

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
    <div className={styles.membersList}>
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
                key={member.id}
                member={member}
                orgId={orgId}
                currentUserRole={currentUserRole}
              />
            ))}
          </tbody>
        </table>
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
  );
};

export default MembersList;