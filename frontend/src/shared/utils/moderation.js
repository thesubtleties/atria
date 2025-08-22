import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { notifications } from '@mantine/notifications';

/**
 * Get moderation permissions for a user
 */
export const getModerationPermissions = (currentUserId, currentUserRole, targetUser) => {
  const isInvitation = !targetUser.user_id;
  const userId = targetUser.user_id;
  const isBanned = targetUser.is_banned;
  const isChatBanned = targetUser.is_chat_banned;
  
  return {
    canModerateUser: !isInvitation && currentUserId !== userId && 
      (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
      !isBanned,
    
    canUnbanUser: !isInvitation && currentUserId !== userId && 
      (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
      isBanned,
    
    canChatModerateUser: !isInvitation && currentUserId !== userId && 
      (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
      !isBanned,
    
    canChatUnmuteUser: !isInvitation && currentUserId !== userId && 
      (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
      isChatBanned,
  };
};

/**
 * Get styling based on moderation status
 */
export const getModerationStyles = (user) => {
  if (user.is_banned) {
    return {
      backgroundColor: 'rgba(255, 250, 250, 0.95)',
      borderLeft: '3px solid rgba(239, 68, 68, 0.5)',
    };
  }
  if (user.is_chat_banned) {
    return {
      backgroundColor: 'rgba(255, 254, 250, 0.95)',
      borderLeft: '3px solid rgba(251, 191, 36, 0.5)',
    };
  }
  return {};
};

/**
 * Get row styling for table (more visible while still subtle)
 */
export const getModerationRowStyles = (user) => {
  // Full ban takes precedence over chat ban
  if (user.is_banned) {
    return {
      backgroundColor: 'rgba(254, 242, 242, 0.6)',
      borderLeft: '4px solid rgba(239, 68, 68, 0.4)',
    };
  }
  if (user.is_chat_banned && !user.is_banned) {
    return {
      backgroundColor: 'rgba(254, 252, 232, 0.6)',
      borderLeft: '4px solid rgba(251, 146, 60, 0.4)',
    };
  }
  return {};
};

/**
 * Create moderation handlers
 */
export const createModerationHandlers = ({
  user,
  currentUserRole,
  banUser,
  unbanUser,
  chatBanUser,
  chatUnbanUser,
}) => {
  const handleBan = () => {
    openConfirmationModal({
      title: 'Ban User from Event',
      message: `Ban ${user.full_name} from the event? They will be removed and cannot rejoin.`,
      confirmLabel: 'Ban User',
      cancelLabel: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await banUser({
            eventId: user.event_id,
            userId: user.user_id,
            reason: 'Violation of event guidelines',
            moderation_notes: `Banned by ${currentUserRole}`,
          }).unwrap();
          
          notifications.show({
            title: 'Success',
            message: `${user.full_name} has been banned from the event`,
            color: 'red',
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
      message: `Allow ${user.full_name} to rejoin the event?`,
      confirmLabel: 'Unban',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await unbanUser({
            eventId: user.event_id,
            userId: user.user_id,
          }).unwrap();
          
          notifications.show({
            title: 'Success',
            message: `${user.full_name} has been unbanned`,
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
      message: `Mute ${user.full_name} from sending chat messages? They can still view chat but cannot send messages.`,
      confirmLabel: 'Mute Chat',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await chatBanUser({
            eventId: user.event_id,
            userId: user.user_id,
            reason: 'Inappropriate chat behavior',
            moderation_notes: `Chat muted by ${currentUserRole}`,
          }).unwrap();
          
          notifications.show({
            title: 'Success',
            message: `${user.full_name} has been muted from chat`,
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
      message: `Allow ${user.full_name} to send chat messages again?`,
      confirmLabel: 'Unmute',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await chatUnbanUser({
            eventId: user.event_id,
            userId: user.user_id,
          }).unwrap();
          
          notifications.show({
            title: 'Success',
            message: `${user.full_name} can now send chat messages`,
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

  return {
    handleBan,
    handleUnban,
    handleChatBan,
    handleChatUnban,
  };
};