import { useState, useEffect, useMemo } from 'react';
import { LoadingOverlay, Center, Text, Badge, Group, ActionIcon, Pagination } from '@mantine/core';
import { IconMail, IconClock, IconRefresh, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useGetOrganizationInvitationsQuery,
  useCancelOrganizationInvitationMutation,
  useSendOrganizationInvitationMutation,
} from '../../../../../app/features/organizations/api';
import { formatDistanceToNow } from 'date-fns';
import styles from './styles/index.module.css';

const PendingInvitations = ({ orgId, searchQuery }) => {
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading, error, refetch } = useGetOrganizationInvitationsQuery({
    orgId,
    page,
    per_page: perPage,
  });

  const [cancelInvitation] = useCancelOrganizationInvitationMutation();
  const [resendInvitation] = useSendOrganizationInvitationMutation();

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Filter invitations based on search query
  const filteredInvitations = useMemo(() => {
    if (!data?.invitations) return [];

    if (!searchQuery) return data.invitations;

    const query = searchQuery.toLowerCase();
    return data.invitations.filter((invitation) => invitation.email?.toLowerCase().includes(query));
  }, [data?.invitations, searchQuery]);

  const handleCancel = async (invitationId, email) => {
    try {
      await cancelInvitation({ orgId, invitationId }).unwrap();
      notifications.show({
        title: 'Success',
        message: `Cancelled invitation to ${email}`,
        color: 'green',
      });
      refetch();
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to cancel invitation',
        color: 'red',
      });
    }
  };

  const handleResend = async (invitation) => {
    try {
      await resendInvitation({
        orgId,
        email: invitation.email,
        role: invitation.role,
        message: invitation.message,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Resent invitation to ${invitation.email}`,
        color: 'green',
      });
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to resend invitation',
        color: 'red',
      });
    }
  };

  const getStatusBadge = (invitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (expiresAt < now) {
      return (
        <Badge variant='unstyled' className={styles.statusBadge} data-status='expired'>
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant='unstyled' className={styles.statusBadge} data-status='active'>
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error) {
    return (
      <Center className={styles.emptyState}>
        <Text color='red'>Failed to load invitations</Text>
      </Center>
    );
  }

  if (filteredInvitations.length === 0) {
    return (
      <Center className={styles.emptyState}>
        <div className={styles.emptyContent}>
          <IconMail size={48} color='#94a3b8' stroke={1.5} />
          <Text size='lg' weight={500} color='dimmed' mt='md'>
            {searchQuery ? 'No invitations found matching your search' : 'No pending invitations'}
          </Text>
          {!searchQuery && (
            <Text size='sm' color='dimmed' mt='xs'>
              Invitations you send will appear here
            </Text>
          )}
        </div>
      </Center>
    );
  }

  return (
    <div className={styles.invitationsList}>
      <div className={styles.tableContainer}>
        <table className={styles.invitationsTable}>
          <thead>
            <tr>
              <th>Email</th>
              <th className={styles.centerColumn}>Role</th>
              <th className={styles.centerColumn}>Status</th>
              <th className={styles.centerColumn}>Sent</th>
              <th className={styles.centerColumn}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvitations.map((invitation) => (
              <tr key={invitation.id} className={styles.invitationRow}>
                <td>
                  <Group spacing='xs'>
                    <IconMail size={16} color='#64748b' />
                    <Text size='sm'>{invitation.email}</Text>
                  </Group>
                </td>
                <td className={styles.centerCell}>
                  <Badge
                    variant='unstyled'
                    className={styles.roleBadge}
                    data-role={invitation.role}
                  >
                    {invitation.role}
                  </Badge>
                </td>
                <td className={styles.centerCell}>{getStatusBadge(invitation)}</td>
                <td className={styles.centerCell}>
                  <Group spacing='xs' justify='center'>
                    <IconClock size={14} color='#94a3b8' />
                    <Text size='sm' color='dimmed'>
                      {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                    </Text>
                  </Group>
                </td>
                <td className={styles.centerCell}>
                  <Group gap={4} justify='center'>
                    <ActionIcon
                      variant='subtle'
                      onClick={() => handleResend(invitation)}
                      title='Resend invitation'
                      className={styles.actionButton}
                    >
                      <IconRefresh size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant='subtle'
                      onClick={() => handleCancel(invitation.id, invitation.email)}
                      title='Cancel invitation'
                      className={styles.cancelActionButton}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
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

export default PendingInvitations;
