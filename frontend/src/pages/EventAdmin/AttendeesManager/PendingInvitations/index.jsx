import {
  Table,
  Badge,
  Text,
  Group,
  ActionIcon,
  Menu,
  Avatar,
} from '@mantine/core';
import {
  IconDots,
  IconX,
  IconRefresh,
  IconClock,
  IconCheck,
} from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import {
  getRoleBadgeColor,
  getRoleDisplayName,
} from '../schemas/attendeeSchemas';
import { useCancelEventInvitationMutation } from '../../../../app/features/eventInvitations/api';
import AttendeeCard from '../AttendeeCard';
import styles from './styles.module.css';

const PendingInvitations = ({ invitations, onRefresh }) => {
  const [cancelInvitation] = useCancelEventInvitationMutation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleCancel = (invitation) => {
    openConfirmationModal({
      title: 'Cancel Invitation',
      message: `Cancel invitation to ${invitation.email}?`,
      confirmLabel: 'Cancel Invitation',
      cancelLabel: 'Keep',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await cancelInvitation(invitation.id).unwrap();
          notifications.show({
            title: 'Success',
            message: 'Invitation cancelled',
            color: 'green',
          });
          onRefresh?.();
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.data?.message || 'Failed to cancel invitation',
            color: 'red',
          });
        }
      },
    });
  };
  // eslint-disable-next-line no-unused-vars
  const handleResend = async (invitation) => {
    // TODO: Implement resend functionality
    notifications.show({
      title: 'Resend',
      message: 'Resend functionality coming soon',
      color: 'blue',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (invitation) => {
    if (invitation.is_expired) {
      return (
        <Badge
          color="gray"
          variant="light"
          leftSection={<IconClock size={14} />}
        >
          Expired
        </Badge>
      );
    }
    if (invitation.status === 'ACCEPTED') {
      return (
        <Badge
          color="green"
          variant="light"
          leftSection={<IconCheck size={14} />}
        >
          Accepted
        </Badge>
      );
    }
    return (
      <Badge
        color="yellow"
        variant="light"
        leftSection={<IconClock size={14} />}
      >
        Pending
      </Badge>
    );
  };

  if (invitations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size="lg" c="dimmed" ta="center">
          No pending invitations
        </Text>
        <Text size="sm" c="dimmed" ta="center" mt="xs">
          All invitations have been accepted or expired
        </Text>
      </div>
    );
  }

  // Mobile view - cards
  if (isMobile) {
    return (
      <div className={styles.cardsContainer}>
        {invitations.map((invitation) => (
          <AttendeeCard
            key={invitation.id}
            data={{
              ...invitation,
              inviter_name: invitation.invited_by?.full_name || 'System',
            }}
            isInvitation={true}
            onRefresh={onRefresh}
            currentUserRole="ADMIN"
          />
        ))}
      </div>
    );
  }

  // Desktop view - table
  return (
    <div className={styles.tableContainer}>
      <Table
        horizontalSpacing="md"
        verticalSpacing="sm"
        striped
        highlightOnHover
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Email</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Invited By</Table.Th>
            <Table.Th>Sent</Table.Th>
            <Table.Th>Expires</Table.Th>
            <Table.Th width={100}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invitations.map((invitation) => (
            <Table.Tr key={invitation.id}>
              <Table.Td>
                <Group gap="sm">
                  <Avatar radius="xl" size="sm">
                    {invitation.email[0].toUpperCase()}
                  </Avatar>
                  <div>
                    <Text size="sm" fw={500}>
                      {invitation.email}
                    </Text>
                    {invitation.user && (
                      <Text size="xs" c="dimmed">
                        {invitation.user.full_name}
                      </Text>
                    )}
                  </div>
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge
                  size="md"
                  radius="sm"
                  color={getRoleBadgeColor(invitation.role)}
                  variant="light"
                >
                  {getRoleDisplayName(invitation.role)}
                </Badge>
              </Table.Td>
              <Table.Td>{getStatusBadge(invitation)}</Table.Td>
              <Table.Td>
                <Text size="sm">
                  {invitation.invited_by?.full_name || 'System'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {formatDate(invitation.created_at)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c={invitation.is_expired ? 'red' : 'dimmed'}>
                  {formatDate(invitation.expires_at)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Menu shadow="md" width={150} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {invitation.is_expired && (
                      <Menu.Item
                        leftSection={<IconRefresh size={16} />}
                        onClick={() => handleResend(invitation)}
                      >
                        Resend
                      </Menu.Item>
                    )}
                    <Menu.Item
                      leftSection={<IconX size={16} />}
                      color="red"
                      onClick={() => handleCancel(invitation)}
                    >
                      Cancel
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
};

export default PendingInvitations;
