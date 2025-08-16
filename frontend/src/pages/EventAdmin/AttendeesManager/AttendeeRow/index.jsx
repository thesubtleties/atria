import { useState } from 'react';
import { Table, Group, Text, Badge, Avatar, Menu, ActionIcon } from '@mantine/core';
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
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { getRoleBadgeColor, getRoleDisplayName, canChangeUserRole } from '../schemas/attendeeSchemas';
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
import { IcebreakerModal } from '../../../../shared/components/IcebreakerModal';
import { useDispatch } from 'react-redux';
import { openThread } from '../../../../app/store/chatSlice';
import styles from './styles.module.css';

const AttendeeRow = ({
  attendee,
  onUpdateRole,
  currentUserRole,
  currentUserId,
  adminCount,
  eventIcebreakers,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [modalOpened, setModalOpened] = useState(false);
  
  const [removeUser] = useRemoveEventUserMutation();
  const [banUser] = useBanEventUserMutation();
  const [unbanUser] = useUnbanEventUserMutation();
  const [chatBanUser] = useChatBanEventUserMutation();
  const [chatUnbanUser] = useChatUnbanEventUserMutation();
  const [createConnection] = useCreateConnectionMutation();
  const [createThread] = useCreateDirectMessageThreadMutation();
  
  // Check connection status
  const { data: connectionsData } = useGetConnectionsQuery({ page: 1, per_page: 1000 });
  const isConnected = connectionsData?.connections?.some(
    conn => (conn.requester.id === attendee.user_id || conn.recipient.id === attendee.user_id) && 
             conn.status === 'ACCEPTED'
  );

  const handleRemove = () => {
    openConfirmationModal({
      title: 'Remove Attendee',
      message: `Remove ${attendee.full_name} from the event?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await removeUser({
            eventId: attendee.event_id,
            userId: attendee.user_id,
          }).unwrap();
          
          notifications.show({
            title: 'Success',
            message: `${attendee.full_name} removed from event`,
            color: 'green',
          });
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.data?.message || 'Failed to remove user',
            color: 'red',
          });
        }
      },
    });
  };

  const handleBan = () => {
    openConfirmationModal({
      title: 'Ban User from Event',
      message: `Ban ${attendee.full_name} from the event? They will not be able to access the event and will be removed from attendee lists.`,
      confirmLabel: 'Ban User',
      cancelLabel: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await banUser({
            eventId: attendee.event_id,
            userId: attendee.user_id,
            reason: 'Inappropriate behavior',
            moderation_notes: `Banned by ${currentUserRole}`,
          }).unwrap();
          
          notifications.show({
            title: 'Success',
            message: `${attendee.full_name} has been banned from the event`,
            color: 'orange',
          });
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.data?.message || 'Failed to ban user',
            color: 'red',
          });
        }
      },
    });
  };

  const handleUnban = () => {
    openConfirmationModal({
      title: 'Unban User',
      message: `Unban ${attendee.full_name} and restore their access to the event?`,
      confirmLabel: 'Unban User',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await unbanUser({
            eventId: attendee.event_id,
            userId: attendee.user_id,
            moderation_notes: `Unbanned by ${currentUserRole}`,
          }).unwrap();
          
          notifications.show({
            title: 'Success',
            message: `${attendee.full_name} has been unbanned`,
            color: 'green',
          });
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.data?.message || 'Failed to unban user',
            color: 'red',
          });
        }
      },
    });
  };

  const handleChatBan = () => {
    openConfirmationModal({
      title: 'Mute User from Chat',
      message: `Mute ${attendee.full_name} from sending chat messages? They can still view chat but cannot send messages.`,
      confirmLabel: 'Mute Chat',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await chatBanUser({
            eventId: attendee.event_id,
            userId: attendee.user_id,
            reason: 'Inappropriate chat behavior',
            moderation_notes: `Chat muted by ${currentUserRole}`,
          }).unwrap();
          
          notifications.show({
            title: 'Success',
            message: `${attendee.full_name} has been muted from chat`,
            color: 'yellow',
          });
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.data?.message || 'Failed to mute user from chat',
            color: 'red',
          });
        }
      },
    });
  };

  const handleChatUnban = () => {
    openConfirmationModal({
      title: 'Unmute User from Chat',
      message: `Unmute ${attendee.full_name} and restore their ability to send chat messages?`,
      confirmLabel: 'Unmute Chat',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await chatUnbanUser({
            eventId: attendee.event_id,
            userId: attendee.user_id,
            moderation_notes: `Chat unmuted by ${currentUserRole}`,
          }).unwrap();
          
          notifications.show({
            title: 'Success',
            message: `${attendee.full_name} has been unmuted from chat`,
            color: 'green',
          });
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.data?.message || 'Failed to unmute user from chat',
            color: 'red',
          });
        }
      },
    });
  };

  // Handle message creation (reuse pattern from AttendeesGrid)
  const handleMessage = async () => {
    try {
      const result = await createThread({
        userId: attendee.user_id,
        eventId: attendee.event_id  // Pass event context for admin messaging
      }).unwrap();
      
      // Get the thread ID from various possible response formats
      const threadId = result.thread_id || result.id || result.data?.thread_id || result.data?.id;
      
      if (threadId) {
        // Add a small delay to ensure the thread is in the cache before opening
        setTimeout(() => {
          dispatch(openThread(threadId));
        }, 100);
        
        notifications.show({
          title: 'Message opened',
          message: `Chat with ${attendee.first_name} is ready`,
          color: 'blue',
        });
      } else {
        console.error('No thread ID received from createThread:', result);
        throw new Error('No thread ID received from server');
      }
    } catch (error) {
      console.error('Failed to create/get thread:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to open message thread. Please try again.',
        color: 'red',
      });
    }
  };

  // Handle connection request (reuse pattern from AttendeesGrid)
  const handleConnect = () => {
    setModalOpened(true);
  };

  const handleSendConnectionRequest = async (icebreakerMessage) => {
    try {
      await createConnection({
        recipientId: attendee.user_id,
        icebreakerMessage,
        originatingEventId: attendee.event_id,
      }).unwrap();

      notifications.show({
        title: 'Connection request sent',
        message: `Your request has been sent to ${attendee.first_name}`,
        color: 'green',
      });

      setModalOpened(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to send connection request. Please try again.',
        color: 'red',
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Check if user can be managed (role changed or removed)
  const canRemoveUser = currentUserRole === 'ADMIN' && currentUserId !== attendee.user_id &&
    !(attendee.role === 'ADMIN' && adminCount <= 1);
  
  // For role changes, we need to check more complex logic
  const canChangeThisUserRole = currentUserId !== attendee.user_id && 
    ((currentUserRole === 'ADMIN') || 
     (currentUserRole === 'ORGANIZER' && ['ATTENDEE', 'SPEAKER'].includes(attendee.role)));

  // Moderation permissions: Organizers can ban/mute, Admins can do everything including remove
  const canModerateUser = currentUserId !== attendee.user_id && 
    (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
    !attendee.is_banned; // Can't moderate already banned users
  
  const canUnbanUser = currentUserId !== attendee.user_id && 
    (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
    attendee.is_banned;
  
  const canChatModerateUser = currentUserId !== attendee.user_id && 
    (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
    !attendee.is_banned; // Can't chat moderate banned users
  
  const canChatUnmuteUser = currentUserId !== attendee.user_id && 
    (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
    attendee.is_chat_banned;

  // Row styling based on moderation status
  const getRowStyle = () => {
    if (attendee.is_banned) {
      return {
        backgroundColor: '#FFFAFA',
        borderLeft: '3px solid #FFF0F0',
      };
    }
    if (attendee.is_chat_banned) {
      return {
        backgroundColor: '#FFFEFA',
        borderLeft: '3px solid #FFF8F0',
      };
    }
    return {};
  };

  return (
    <>
      <Table.Tr style={getRowStyle()}>
      <Table.Td>
        <Group gap="sm">
          <Avatar
            src={attendee.image_url}
            alt={attendee.full_name}
            radius="xl"
            size="md"
          >
            {attendee.first_name?.[0]}{attendee.last_name?.[0]}
          </Avatar>
          <div>
            <Text size="sm" fw={500}>
              {attendee.full_name}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {attendee.email}
        </Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Badge
          size="md"
          radius="sm"
          color={getRoleBadgeColor(attendee.role)}
          variant="light"
          className={styles.roleBadge}
        >
          {getRoleDisplayName(attendee.role)}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{attendee.company_name || '-'}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{attendee.title || '-'}</Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Text size="sm" c="dimmed">
          {formatDate(attendee.created_at)}
        </Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Menu 
          shadow="md" 
          width={200} 
          position="bottom-end"
        >
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" className={styles.actionIcon}>
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown className={styles.menuDropdown}>
            <Menu.Item
              className={styles.menuItem}
              leftSection={<IconUserCircle size={16} />}
              onClick={() => navigate(`/app/users/${attendee.user_id}`)}
            >
              View Profile
            </Menu.Item>
            
            {canChangeThisUserRole && (
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconEdit size={16} />}
                onClick={() => onUpdateRole(attendee)}
              >
                Change Role
              </Menu.Item>
            )}
            
            {attendee.role === 'SPEAKER' && currentUserRole === 'ADMIN' && (
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconMicrophone size={16} />}
                onClick={() => navigate(`/app/events/${attendee.event_id}/admin/speakers`)}
              >
                Manage Speaker Info
              </Menu.Item>
            )}
            
            {/* Moderation Actions */}
            {(canModerateUser || canUnbanUser || canChatModerateUser || canChatUnmuteUser) && (
              <Menu.Divider />
            )}
            
            {canUnbanUser && (
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconUserCheck size={16} />}
                onClick={handleUnban}
              >
                Unban from Event
              </Menu.Item>
            )}
            
            {canModerateUser && (
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconBan size={16} />}
                onClick={handleBan}
              >
                Ban from Event
              </Menu.Item>
            )}
            
            {canChatUnmuteUser && (
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconVolume3 size={16} />}
                onClick={handleChatUnban}
              >
                Unmute Chat
              </Menu.Item>
            )}
            
            {canChatModerateUser && !attendee.is_chat_banned && (
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconVolumeOff size={16} />}
                onClick={handleChatBan}
              >
                Mute Chat
              </Menu.Item>
            )}
            
            {canRemoveUser && (
              <>
                <Menu.Divider />
                <Menu.Item
                  className={styles.menuItemDanger}
                  leftSection={<IconTrash size={16} />}
                  onClick={handleRemove}
                >
                  Remove from Event
                </Menu.Item>
              </>
            )}
            
            {/* Add Connect option if not connected and not self */}
            {!isConnected && currentUserId !== attendee.user_id && (
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconUserPlus size={16} />}
                onClick={handleConnect}
              >
                Connect
              </Menu.Item>
            )}

            {/* Send Message - always available except to self */}
            {currentUserId !== attendee.user_id && (
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconMessage size={16} />}
                onClick={handleMessage}
              >
                Send Message
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
      </Table.Tr>
      
      {/* IcebreakerModal for connection requests */}
      <IcebreakerModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        recipient={{
          id: attendee.user_id,
          firstName: attendee.first_name,
          lastName: attendee.last_name,
          title: attendee.title,
          company: attendee.company_name,
          avatarUrl: attendee.image_url,
        }}
        eventIcebreakers={eventIcebreakers || []}
        onSend={handleSendConnectionRequest}
        isLoading={false}
      />
    </>
  );
};

export default AttendeeRow;