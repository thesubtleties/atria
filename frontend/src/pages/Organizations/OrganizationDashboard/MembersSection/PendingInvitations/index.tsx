import { useState, useEffect, useMemo } from 'react';
import { LoadingOverlay, Center, Text, Badge, Group, ActionIcon, Pagination } from '@mantine/core';
import { IconMail, IconClock, IconRefresh, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useGetOrganizationInvitationsQuery,
  useCancelOrganizationInvitationMutation,
  useSendOrganizationInvitationMutation,
} from '@/app/features/organizations/api';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { ApiError, OrganizationUserRole } from '@/types';

type PendingInvitationsProps = {
  orgId?: string | undefined;
  searchQuery: string;
};

type Invitation = {
  id: number;
  email: string;
  role: string;
  message?: string;
  created_at: string;
  expires_at: string;
};

type InvitationsResponse = {
  invitations?: Invitation[];
  total_pages?: number;
};

const PendingInvitations = ({ orgId, searchQuery }: PendingInvitationsProps) => {
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading, error, refetch } = useGetOrganizationInvitationsQuery(
    {
      orgId: orgId ? parseInt(orgId) : 0,
      page,
      per_page: perPage,
    },
    { skip: !orgId },
  );

  const typedData = data as InvitationsResponse | undefined;

  const [cancelInvitation] = useCancelOrganizationInvitationMutation();
  const [resendInvitation] = useSendOrganizationInvitationMutation();

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const filteredInvitations = useMemo(() => {
    if (!typedData?.invitations) return [];

    if (!searchQuery) return typedData.invitations;

    const query = searchQuery.toLowerCase();
    return typedData.invitations.filter((invitation) =>
      invitation.email?.toLowerCase().includes(query),
    );
  }, [typedData?.invitations, searchQuery]);

  const handleCancel = async (invitationId: number, email: string) => {
    try {
      await cancelInvitation({ orgId: orgId ? parseInt(orgId) : 0, invitationId }).unwrap();
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

  const handleResend = async (invitation: Invitation) => {
    try {
      await resendInvitation({
        orgId: orgId ? parseInt(orgId) : 0,
        email: invitation.email,
        role: invitation.role as OrganizationUserRole,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Resent invitation to ${invitation.email}`,
        color: 'green',
      });
      refetch();
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to resend invitation',
        color: 'red',
      });
    }
  };

  const getStatusBadge = (invitation: Invitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (expiresAt < now) {
      return (
        <Badge variant='light' className={cn(styles.statusBadge)} data-status='expired'>
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant='light' className={cn(styles.statusBadge)} data-status='active'>
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error) {
    return (
      <Center className={cn(styles.emptyState)}>
        <Text c='red'>Failed to load invitations</Text>
      </Center>
    );
  }

  if (filteredInvitations.length === 0) {
    return (
      <Center className={cn(styles.emptyState)}>
        <div className={cn(styles.emptyContent)}>
          <IconMail size={48} color='#94a3b8' stroke={1.5} />
          <Text size='lg' fw={500} c='dimmed' mt='md'>
            {searchQuery ? 'No invitations found matching your search' : 'No pending invitations'}
          </Text>
          {!searchQuery && (
            <Text size='sm' c='dimmed' mt='xs'>
              Invitations you send will appear here
            </Text>
          )}
        </div>
      </Center>
    );
  }

  return (
    <div className={cn(styles.invitationsList)}>
      <div className={cn(styles.tableContainer)}>
        <table className={cn(styles.invitationsTable)}>
          <thead>
            <tr>
              <th>Email</th>
              <th className={cn(styles.centerColumn)}>Role</th>
              <th className={cn(styles.centerColumn)}>Status</th>
              <th className={cn(styles.centerColumn)}>Sent</th>
              <th className={cn(styles.centerColumn)}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvitations.map((invitation) => (
              <tr key={invitation.id} className={cn(styles.invitationRow)}>
                <td>
                  <Group gap='xs'>
                    <IconMail size={16} color='#64748b' />
                    <Text size='sm'>{invitation.email}</Text>
                  </Group>
                </td>
                <td className={cn(styles.centerCell)}>
                  <Badge
                    variant='light'
                    className={cn(styles.roleBadge)}
                    data-role={invitation.role}
                  >
                    {invitation.role}
                  </Badge>
                </td>
                <td className={cn(styles.centerCell)}>{getStatusBadge(invitation)}</td>
                <td className={cn(styles.centerCell)}>
                  <Group gap='xs' justify='center'>
                    <IconClock size={14} color='#94a3b8' />
                    <Text size='sm' c='dimmed'>
                      {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                    </Text>
                  </Group>
                </td>
                <td className={cn(styles.centerCell)}>
                  <Group gap={4} justify='center'>
                    <ActionIcon
                      variant='subtle'
                      onClick={() => handleResend(invitation)}
                      title='Resend invitation'
                      className={cn(styles.actionButton)}
                    >
                      <IconRefresh size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant='subtle'
                      onClick={() => handleCancel(invitation.id, invitation.email)}
                      title='Cancel invitation'
                      className={cn(styles.cancelActionButton)}
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
  );
};

export default PendingInvitations;
