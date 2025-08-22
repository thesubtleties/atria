import { useState } from 'react';
import { Group, Text, Avatar, Menu, ActionIcon, Badge, Stack, Collapse } from '@mantine/core';
import {
  IconDots,
  IconUserCircle,
  IconEdit,
  IconTrash,
  IconMessage,
  IconMicrophone,
  IconBan,
  IconVolume3,
  IconVolumeOff,
  IconUserCheck,
  IconUserPlus,
  IconX,
  IconRefresh,
  IconClock,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { getRoleDisplayName, canChangeUserRole } from '../schemas/attendeeSchemas';
import { useRemoveEventUserMutation } from '../../../../app/features/events/api';
import { 
  useBanEventUserMutation,
  useUnbanEventUserMutation,
  useChatBanEventUserMutation,
  useChatUnbanEventUserMutation,
} from '../../../../app/features/moderation/api';
import {
  useGetConnectionsQuery,
  useCreateConnectionMutation,
  useCreateDirectMessageThreadMutation,
} from '../../../../app/features/networking/api';
import { useCancelEventInvitationMutation } from '../../../../app/features/eventInvitations/api';
import { IcebreakerModal } from '../../../../shared/components/IcebreakerModal';
import { useDispatch } from 'react-redux';
import { openThread } from '../../../../app/store/chatSlice';
import { formatTime, capitalizeWords } from '@/shared/utils/formatting';
import { getModerationPermissions, getModerationStyles, createModerationHandlers } from '@/shared/utils/moderation';
import styles from './styles.module.css';

const AttendeeCard = ({
  data,
  isInvitation = false,
  onUpdateRole,
  currentUserRole,
  currentUserId,
  adminCount,
  eventIcebreakers,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [modalOpened, setModalOpened] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  
  // Mutations
  const [removeUser] = useRemoveEventUserMutation();
  const [banUser] = useBanEventUserMutation();
  const [unbanUser] = useUnbanEventUserMutation();
  const [chatBanUser] = useChatBanEventUserMutation();
  const [chatUnbanUser] = useChatUnbanEventUserMutation();
  const [createConnection] = useCreateConnectionMutation();
  const [createThread] = useCreateDirectMessageThreadMutation();
  const [cancelInvitation] = useCancelEventInvitationMutation();
  
  // Check connection status (for attendees only)
  const { data: connectionsData } = useGetConnectionsQuery(
    { page: 1, per_page: 1000 },
    { skip: isInvitation }
  );
  const isConnected = !isInvitation && connectionsData?.connections?.some(
    conn => (conn.requester.id === data.user_id || conn.recipient.id === data.user_id) && 
             conn.status === 'ACCEPTED'
  );

  // Get moderation permissions
  const {
    canModerateUser,
    canUnbanUser,
    canChatModerateUser,
    canChatUnmuteUser,
  } = getModerationPermissions(currentUserId, currentUserRole, data);
  
  // Create moderation handlers
  const {
    handleBan,
    handleUnban,
    handleChatBan,
    handleChatUnban,
  } = createModerationHandlers({
    user: data,
    currentUserRole,
    banUser,
    unbanUser,
    chatBanUser,
    chatUnbanUser,
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle actions for attendees
  const handleRemove = () => {
    const confirmMessage = isInvitation 
      ? `Cancel invitation to ${data.email}?`
      : `Remove ${data.full_name} from the event?`;
    
    openConfirmationModal({
      title: isInvitation ? 'Cancel Invitation' : 'Remove Attendee',
      message: confirmMessage,
      confirmLabel: isInvitation ? 'Cancel Invitation' : 'Remove',
      cancelLabel: isInvitation ? 'Keep' : 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          if (isInvitation) {
            await cancelInvitation(data.id).unwrap();
            notifications.show({
              title: 'Success',
              message: 'Invitation cancelled',
              color: 'green',
            });
          } else {
            await removeUser({
              eventId: data.event_id,
              userId: data.user_id,
            }).unwrap();
            notifications.show({
              title: 'Success',
              message: `${data.full_name} removed from event`,
              color: 'green',
            });
          }
          onRefresh?.();
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.data?.message || 'Failed to perform action',
            color: 'red',
          });
        }
      },
    });
  };

  const handleConnect = () => {
    setModalOpened(true);
  };

  const handleMessage = async () => {
    try {
      const result = await createThread({
        userId: data.user_id,
        eventId: data.event_id  // Include event context for proper thread creation
      }).unwrap();
      
      dispatch(openThread(result));
      
      notifications.show({
        title: 'Success',
        message: 'Message thread opened',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to create message thread',
        color: 'red',
      });
    }
  };

  const canManage = ['ADMIN', 'ORGANIZER'].includes(currentUserRole);
  
  // Get status badge for invitations
  const getInvitationStatus = () => {
    if (!isInvitation) return null;
    
    if (data.is_expired) {
      return (
        <Badge color="gray" variant="light" leftSection={<IconClock size={14} />}>
          Expired
        </Badge>
      );
    }
    if (data.status === 'ACCEPTED') {
      return (
        <Badge color="green" variant="light" leftSection={<IconCheck size={14} />}>
          Accepted
        </Badge>
      );
    }
    return (
      <Badge color="blue" variant="light" leftSection={<IconClock size={14} />}>
        Pending
      </Badge>
    );
  };

  return (
    <div className={styles.card} style={getModerationStyles(data)}>
      {/* Card Actions - Top right corner */}
      {canManage && (
        <div className={styles.cardActions}>
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" className={styles.actionButton}>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {!isInvitation ? (
                <>
                  {/* Only show View Profile if connected or own profile */}
                  {(isConnected || currentUserId === data.user_id) && (
                    <Menu.Item
                      leftSection={<IconUserCircle size={16} />}
                      onClick={() => navigate(`/app/users/${data.user_id}`)}
                    >
                      View Profile
                    </Menu.Item>
                  )}
                  
                  {canChangeUserRole(currentUserRole, data.role, adminCount) && (
                    <Menu.Item
                      leftSection={<IconEdit size={16} />}
                      onClick={() => onUpdateRole(data)}
                    >
                      Change Role
                    </Menu.Item>
                  )}
                  
                  {data.role === 'SPEAKER' && (
                    <Menu.Item
                      leftSection={<IconMicrophone size={16} />}
                      onClick={() => navigate(`/app/organizations/${data.organization_id}/events/${data.event_id}/admin/speakers`)}
                    >
                      Manage as Speaker
                    </Menu.Item>
                  )}
                  
                  {/* Moderation Actions */}
                  {(canModerateUser || canUnbanUser || canChatModerateUser || canChatUnmuteUser) && (
                    <Menu.Divider />
                  )}
                  
                  {canUnbanUser && (
                    <Menu.Item
                      leftSection={<IconUserCheck size={16} />}
                      onClick={handleUnban}
                    >
                      Unban from Event
                    </Menu.Item>
                  )}
                  
                  {canModerateUser && (
                    <Menu.Item
                      leftSection={<IconBan size={16} />}
                      onClick={handleBan}
                      color="red"
                    >
                      Ban from Event
                    </Menu.Item>
                  )}
                  
                  {canChatModerateUser && !data.is_chat_banned && (
                    <Menu.Item
                      leftSection={<IconVolumeOff size={16} />}
                      onClick={handleChatBan}
                      color="yellow"
                    >
                      Mute Chat
                    </Menu.Item>
                  )}
                  
                  {canChatUnmuteUser && (
                    <Menu.Item
                      leftSection={<IconVolume3 size={16} />}
                      onClick={handleChatUnban}
                    >
                      Unmute Chat
                    </Menu.Item>
                  )}
                  
                  {/* Admin Actions */}
                  {currentUserRole === 'ADMIN' && (
                    <>
                      <Menu.Divider />
                      <Menu.Item
                        leftSection={<IconTrash size={16} />}
                        color="red"
                        onClick={handleRemove}
                      >
                        Remove from Event
                      </Menu.Item>
                    </>
                  )}
                  
                  {/* Connection Actions */}
                  {currentUserId !== data.user_id && (
                    <>
                      <Menu.Divider />
                      {isConnected ? (
                        <Menu.Item
                          leftSection={<IconMessage size={16} />}
                          onClick={handleMessage}
                        >
                          Send Message
                        </Menu.Item>
                      ) : (
                        <Menu.Item
                          leftSection={<IconUserPlus size={16} />}
                          onClick={handleConnect}
                        >
                          Connect
                        </Menu.Item>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <Menu.Item
                    leftSection={<IconRefresh size={16} />}
                    onClick={() => {
                      notifications.show({
                        title: 'Coming Soon',
                        message: 'Resend functionality will be available soon',
                        color: 'blue',
                      });
                    }}
                  >
                    Resend Invitation
                  </Menu.Item>
                  
                  <Menu.Divider />
                  
                  <Menu.Item
                    leftSection={<IconX size={16} />}
                    color="red"
                    onClick={handleRemove}
                  >
                    Cancel Invitation
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </div>
      )}

      {/* User/Invitation Info Section */}
      <div className={styles.userInfo}>
        <Avatar
          src={!isInvitation ? data.image_url : null}
          alt={!isInvitation ? data.full_name : data.email}
          radius="xl"
          size={50}
          className={styles.avatar}
        >
          {!isInvitation 
            ? `${data.first_name?.[0] || ''}${data.last_name?.[0] || ''}`
            : data.email?.[0]?.toUpperCase()
          }
        </Avatar>
        <div className={styles.userDetails}>
          <Group gap="xs" wrap="nowrap" align="center">
            <Text fw={600} className={styles.userName}>
              {!isInvitation ? data.full_name : data.email}
            </Text>
            {!isInvitation && isConnected && (
              <IconUserCheck 
                size={14} 
                style={{ color: 'rgba(139, 92, 246, 0.7)', flexShrink: 0 }}
                title="Connected"
              />
            )}
          </Group>
          <Text size="sm" className={styles.userEmail}>
            {!isInvitation ? data.email : `Invited by: ${data.inviter_name || 'Unknown'}`}
          </Text>
          {/* Role badges inline */}
          <Group gap="xs" mt={4}>
            <Badge 
              className={styles[`${data.role.toLowerCase()}Badge`] || styles.roleBadge}
              radius="sm"
              size="sm"
            >
              {getRoleDisplayName(data.role)}
            </Badge>
            {isInvitation && getInvitationStatus()}
          </Group>
        </div>
      </div>

      {/* Additional Info - Expandable on mobile */}
      <div 
        className={styles.expandableSection}
        onClick={() => setDetailsExpanded(!detailsExpanded)}
      >
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" fw={500}>
            {isInvitation ? 'Invitation Details' : 'Additional Info'}
          </Text>
          <ActionIcon size="xs" variant="transparent">
            {detailsExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          </ActionIcon>
        </Group>
      </div>

      <Collapse in={detailsExpanded}>
        <div className={styles.detailsList}>
          {!isInvitation ? (
            <>
              {data.company_name && (
                <div className={styles.detailItem}>
                  <Text size="xs" c="dimmed">Company</Text>
                  <Text size="sm">{data.company_name}</Text>
                </div>
              )}
              {data.title && (
                <div className={styles.detailItem}>
                  <Text size="xs" c="dimmed">Title</Text>
                  <Text size="sm">{data.title}</Text>
                </div>
              )}
              <div className={styles.detailItem}>
                <Text size="xs" c="dimmed">Joined Event</Text>
                <Text size="sm">{formatDate(data.created_at)}</Text>
              </div>
              {data.is_banned && (
                <Badge className={styles.bannedBadge} radius="sm" size="sm" leftSection={<IconBan size={12} />}>
                  Banned
                </Badge>
              )}
              {data.is_chat_banned && (
                <Badge className={styles.chatBannedBadge} radius="sm" size="sm" leftSection={<IconVolumeOff size={12} />}>
                  Chat Banned
                </Badge>
              )}
            </>
          ) : (
            <>
              <div className={styles.detailItem}>
                <Text size="xs" c="dimmed">Sent</Text>
                <Text size="sm">{formatDate(data.created_at)}</Text>
              </div>
              <div className={styles.detailItem}>
                <Text size="xs" c="dimmed">Expires</Text>
                <Text size="sm">{formatDate(data.expires_at)}</Text>
              </div>
              {data.message && (
                <div className={styles.detailItem}>
                  <Text size="xs" c="dimmed">Message</Text>
                  <Text size="sm" lineClamp={2}>{data.message}</Text>
                </div>
              )}
            </>
          )}
        </div>
      </Collapse>

      {/* Icebreaker Modal for connections */}
      {!isInvitation && modalOpened && (
        <IcebreakerModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          recipientId={data.user_id}
          recipientName={data.full_name}
          eventIcebreakers={eventIcebreakers}
        />
      )}
    </div>
  );
};

export default AttendeeCard;