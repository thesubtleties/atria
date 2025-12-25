import { useState } from 'react';
import { Group, Text, Avatar, Menu, ActionIcon, Badge, Collapse } from '@mantine/core';
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
import type { EventUserRoleType } from '../schemas/attendeeSchemas';
import { useRemoveEventUserMutation } from '@/app/features/events/api';
import {
  useBanEventUserMutation,
  useUnbanEventUserMutation,
  useChatBanEventUserMutation,
  useChatUnbanEventUserMutation,
} from '@/app/features/moderation/api';
import {
  useGetConnectionsQuery,
  useCreateDirectMessageThreadMutation,
} from '@/app/features/networking/api';
import { useCancelEventInvitationMutation } from '@/app/features/eventInvitations/api';
import { IcebreakerModal } from '@/shared/components/IcebreakerModal';
import { useDispatch } from 'react-redux';
import { openThread } from '@/app/store/chatSlice';
import {
  getModerationPermissions,
  getModerationStyles,
  createModerationHandlers,
} from '@/shared/utils/moderation';
import { cn } from '@/lib/cn';
import type { EventUser } from '@/types';
import type { ApiError } from '@/types';
import styles from './styles.module.css';

type EventInvitation = {
  id: number;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  message?: string;
  is_expired?: boolean;
  inviter_name?: string;
  event_id?: number;
};

type AttendeeCardData = EventUser | EventInvitation;

type AttendeeCardProps = {
  data: AttendeeCardData;
  isInvitation?: boolean;
  onUpdateRole: (user: EventUser) => void;
  currentUserRole: EventUserRoleType;
  currentUserId: number | undefined;
  adminCount: number;
  eventIcebreakers: string[];
  onRefresh?: () => void;
};

const AttendeeCard = ({
  data,
  isInvitation = false,
  onUpdateRole,
  currentUserRole,
  currentUserId,
  adminCount,
  eventIcebreakers,
  onRefresh,
}: AttendeeCardProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [modalOpened, setModalOpened] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Type guards and assertions
  const attendeeData = data as EventUser;
  const invitationData = data as EventInvitation;

  // Mutations
  const [removeUser] = useRemoveEventUserMutation();
  const [banUser] = useBanEventUserMutation();
  const [unbanUser] = useUnbanEventUserMutation();
  const [chatBanUser] = useChatBanEventUserMutation();
  const [chatUnbanUser] = useChatUnbanEventUserMutation();
  const [createThread] = useCreateDirectMessageThreadMutation();
  const [cancelInvitation] = useCancelEventInvitationMutation();

  // Check connection status (for attendees only)
  const { data: connectionsData } = useGetConnectionsQuery(
    { page: 1, perPage: 1000 },
    { skip: isInvitation },
  );
  const isConnected =
    !isInvitation &&
    connectionsData?.connections?.some(
      (conn: { requester: { id: number }; recipient: { id: number }; status: string }) =>
        (conn.requester.id === attendeeData.user_id ||
          conn.recipient.id === attendeeData.user_id) &&
        conn.status === 'ACCEPTED',
    );

  // Get moderation permissions
  const { canModerateUser, canUnbanUser, canChatModerateUser, canChatUnmuteUser } =
    getModerationPermissions(currentUserId ?? 0, currentUserRole, attendeeData);

  // Create moderation handlers with typed wrapper functions
  const { handleBan, handleUnban, handleChatBan, handleChatUnban } = createModerationHandlers({
    user: attendeeData,
    currentUserRole,
    banUser: (params) =>
      banUser({ ...params, reason: params.reason || 'Violation of event guidelines' }),
    unbanUser,
    chatBanUser: (params) =>
      chatBanUser({ ...params, reason: params.reason || 'Inappropriate chat behavior' }),
    chatUnbanUser,
  });

  // Format date for display
  const formatDate = (dateString: string | null | undefined): string => {
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
    const confirmMessage =
      isInvitation ?
        `Cancel invitation to ${invitationData.email}?`
      : `Remove ${attendeeData.full_name} from the event?`;

    openConfirmationModal({
      title: isInvitation ? 'Cancel Invitation' : 'Remove Attendee',
      message: confirmMessage,
      confirmLabel: isInvitation ? 'Cancel Invitation' : 'Remove',
      cancelLabel: isInvitation ? 'Keep' : 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          if (isInvitation) {
            await cancelInvitation({ invitationId: invitationData.id }).unwrap();
            notifications.show({
              title: 'Success',
              message: 'Invitation cancelled',
              color: 'green',
            });
          } else {
            await removeUser({
              eventId: attendeeData.event_id,
              userId: attendeeData.user_id,
            }).unwrap();
            notifications.show({
              title: 'Success',
              message: `${attendeeData.full_name} removed from event`,
              color: 'green',
            });
          }
          onRefresh?.();
        } catch (error) {
          const apiError = error as ApiError;
          notifications.show({
            title: 'Error',
            message: apiError.data?.message || 'Failed to perform action',
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
        userId: attendeeData.user_id,
        eventId: attendeeData.event_id, // Include event context for proper thread creation
      }).unwrap();

      dispatch(openThread(result.id));

      notifications.show({
        title: 'Success',
        message: 'Message thread opened',
        color: 'green',
      });
    } catch (error) {
      const apiError = error as ApiError;
      notifications.show({
        title: 'Error',
        message: apiError.data?.message || 'Failed to create message thread',
        color: 'red',
      });
    }
  };

  const canManage = ['ADMIN', 'ORGANIZER'].includes(currentUserRole);

  // Get status badge for invitations
  const getInvitationStatus = () => {
    if (!isInvitation) return null;

    if (invitationData.is_expired) {
      return (
        <Badge color='gray' variant='light' leftSection={<IconClock size={14} />}>
          Expired
        </Badge>
      );
    }
    if (invitationData.status === 'ACCEPTED') {
      return (
        <Badge color='green' variant='light' leftSection={<IconCheck size={14} />}>
          Accepted
        </Badge>
      );
    }
    return (
      <Badge color='blue' variant='light' leftSection={<IconClock size={14} />}>
        Pending
      </Badge>
    );
  };

  const roleValue = isInvitation ? invitationData.role : attendeeData.role;
  const roleClassName = styles[`${roleValue?.toLowerCase()}Badge`] || styles.roleBadge;

  return (
    <div className={cn(styles.card)} style={getModerationStyles(attendeeData)}>
      {/* Card Actions - Top right corner */}
      {canManage && (
        <div className={cn(styles.cardActions)}>
          <Menu position='bottom-end' withinPortal>
            <Menu.Target>
              <ActionIcon variant='subtle' className={cn(styles.actionButton)}>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {!isInvitation ?
                <>
                  {/* Only show View Profile if connected or own profile */}
                  {(isConnected || currentUserId === attendeeData.user_id) && (
                    <Menu.Item
                      leftSection={<IconUserCircle size={16} />}
                      onClick={() => navigate(`/app/users/${attendeeData.user_id}`)}
                    >
                      View Profile
                    </Menu.Item>
                  )}

                  {canChangeUserRole(
                    currentUserRole,
                    currentUserId!,
                    attendeeData.user_id,
                    attendeeData.role as EventUserRoleType,
                    attendeeData.role as EventUserRoleType,
                    adminCount,
                  ).allowed && (
                    <Menu.Item
                      leftSection={<IconEdit size={16} />}
                      onClick={() => onUpdateRole(attendeeData)}
                    >
                      Change Role
                    </Menu.Item>
                  )}

                  {attendeeData.role === 'SPEAKER' && (
                    <Menu.Item
                      leftSection={<IconMicrophone size={16} />}
                      onClick={() =>
                        navigate(
                          `/app/organizations/${(data as EventUser & { organization_id?: number }).organization_id}/events/${attendeeData.event_id}/admin/speakers`,
                        )
                      }
                    >
                      Manage as Speaker
                    </Menu.Item>
                  )}

                  {/* Moderation Actions */}
                  {(canModerateUser ||
                    canUnbanUser ||
                    canChatModerateUser ||
                    canChatUnmuteUser) && <Menu.Divider />}

                  {canUnbanUser && (
                    <Menu.Item leftSection={<IconUserCheck size={16} />} onClick={handleUnban}>
                      Unban from Event
                    </Menu.Item>
                  )}

                  {canModerateUser && (
                    <Menu.Item leftSection={<IconBan size={16} />} onClick={handleBan} color='red'>
                      Ban from Event
                    </Menu.Item>
                  )}

                  {canChatModerateUser && !attendeeData.is_chat_banned && (
                    <Menu.Item
                      leftSection={<IconVolumeOff size={16} />}
                      onClick={handleChatBan}
                      color='yellow'
                    >
                      Mute Chat
                    </Menu.Item>
                  )}

                  {canChatUnmuteUser && (
                    <Menu.Item leftSection={<IconVolume3 size={16} />} onClick={handleChatUnban}>
                      Unmute Chat
                    </Menu.Item>
                  )}

                  {/* Admin Actions */}
                  {currentUserRole === 'ADMIN' && (
                    <>
                      <Menu.Divider />
                      <Menu.Item
                        leftSection={<IconTrash size={16} />}
                        color='red'
                        onClick={handleRemove}
                      >
                        Remove from Event
                      </Menu.Item>
                    </>
                  )}

                  {/* Connection Actions */}
                  {currentUserId !== attendeeData.user_id && (
                    <>
                      <Menu.Divider />
                      {isConnected ?
                        <Menu.Item leftSection={<IconMessage size={16} />} onClick={handleMessage}>
                          Send Message
                        </Menu.Item>
                      : <Menu.Item leftSection={<IconUserPlus size={16} />} onClick={handleConnect}>
                          Connect
                        </Menu.Item>
                      }
                    </>
                  )}
                </>
              : <>
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

                  <Menu.Item leftSection={<IconX size={16} />} color='red' onClick={handleRemove}>
                    Cancel Invitation
                  </Menu.Item>
                </>
              }
            </Menu.Dropdown>
          </Menu>
        </div>
      )}

      {/* User/Invitation Info Section */}
      <div className={cn(styles.userInfo)}>
        <Avatar
          src={!isInvitation ? attendeeData.image_url : null}
          alt={!isInvitation ? attendeeData.full_name : invitationData.email}
          radius='xl'
          size={50}
          className={cn(styles.avatar)}
        >
          {!isInvitation ?
            `${attendeeData.first_name?.[0] || ''}${attendeeData.last_name?.[0] || ''}`
          : invitationData.email?.[0]?.toUpperCase()}
        </Avatar>
        <div className={cn(styles.userDetails)}>
          <Group gap='xs' wrap='nowrap' align='center'>
            <Text fw={600} className={cn(styles.userName)}>
              {!isInvitation ? attendeeData.full_name : invitationData.email}
            </Text>
            {!isInvitation && isConnected && (
              <IconUserCheck
                size={14}
                style={{ color: 'rgba(139, 92, 246, 0.7)', flexShrink: 0 }}
                title='Connected'
              />
            )}
          </Group>
          <Text size='sm' className={cn(styles.userEmail)}>
            {!isInvitation ?
              attendeeData.email
            : `Invited by: ${invitationData.inviter_name || 'Unknown'}`}
          </Text>
          {/* Role badges inline */}
          <Group gap='xs' mt={4}>
            <Badge className={cn(roleClassName)} radius='sm' size='sm'>
              {getRoleDisplayName(roleValue as EventUserRoleType)}
            </Badge>
            {isInvitation && getInvitationStatus()}
          </Group>
        </div>
      </div>

      {/* Additional Info - Expandable on mobile */}
      <div
        className={cn(styles.expandableSection)}
        onClick={() => setDetailsExpanded(!detailsExpanded)}
      >
        <Group justify='space-between' wrap='nowrap'>
          <Text size='sm' fw={500}>
            {isInvitation ? 'Invitation Details' : 'Additional Info'}
          </Text>
          <ActionIcon size='xs' variant='transparent'>
            {detailsExpanded ?
              <IconChevronUp size={14} />
            : <IconChevronDown size={14} />}
          </ActionIcon>
        </Group>
      </div>

      <Collapse in={detailsExpanded}>
        <div className={cn(styles.detailsList)}>
          {!isInvitation ?
            <>
              {attendeeData.company_name && (
                <div className={cn(styles.detailItem)}>
                  <Text size='xs' c='dimmed'>
                    Company
                  </Text>
                  <Text size='sm'>{attendeeData.company_name}</Text>
                </div>
              )}
              {attendeeData.title && (
                <div className={cn(styles.detailItem)}>
                  <Text size='xs' c='dimmed'>
                    Title
                  </Text>
                  <Text size='sm'>{attendeeData.title}</Text>
                </div>
              )}
              <div className={cn(styles.detailItem)}>
                <Text size='xs' c='dimmed'>
                  Joined Event
                </Text>
                <Text size='sm'>{formatDate(attendeeData.created_at)}</Text>
              </div>
              {attendeeData.is_banned && (
                <Badge
                  className={cn(styles.bannedBadge)}
                  radius='sm'
                  size='sm'
                  leftSection={<IconBan size={12} />}
                >
                  Banned
                </Badge>
              )}
              {attendeeData.is_chat_banned && (
                <Badge
                  className={cn(styles.chatBannedBadge)}
                  radius='sm'
                  size='sm'
                  leftSection={<IconVolumeOff size={12} />}
                >
                  Chat Banned
                </Badge>
              )}
            </>
          : <>
              <div className={cn(styles.detailItem)}>
                <Text size='xs' c='dimmed'>
                  Sent
                </Text>
                <Text size='sm'>{formatDate(invitationData.created_at)}</Text>
              </div>
              <div className={cn(styles.detailItem)}>
                <Text size='xs' c='dimmed'>
                  Expires
                </Text>
                <Text size='sm'>{formatDate(invitationData.expires_at)}</Text>
              </div>
              {invitationData.message && (
                <div className={cn(styles.detailItem)}>
                  <Text size='xs' c='dimmed'>
                    Message
                  </Text>
                  <Text size='sm' lineClamp={2}>
                    {invitationData.message}
                  </Text>
                </div>
              )}
            </>
          }
        </div>
      </Collapse>

      {/* Icebreaker Modal for connections */}
      {!isInvitation && modalOpened && (
        <IcebreakerModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          recipient={{
            firstName: attendeeData.first_name,
            lastName: attendeeData.last_name,
            title: attendeeData.title || undefined,
            avatarUrl: attendeeData.image_url,
          }}
          eventIcebreakers={eventIcebreakers}
          onSend={async (icebreaker: string) => {
            // TODO: Implement connection request with icebreaker
            console.log('Send icebreaker:', icebreaker);
            setModalOpened(false);
          }}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default AttendeeCard;
