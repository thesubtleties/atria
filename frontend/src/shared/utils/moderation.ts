import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { notifications } from '@mantine/notifications';

type TargetUser = {
  user_id?: number;
  is_banned: boolean;
  is_chat_banned: boolean;
};

type BanMutationParams = {
  eventId: number;
  userId: number;
  reason?: string;
  moderation_notes?: string;
};

type UnbanMutationParams = {
  eventId: number;
  userId: number;
};

type ModerationHandlersParams = {
  user: {
    full_name: string;
    event_id: number;
    user_id: number;
  };
  currentUserRole: string;
  banUser: (params: BanMutationParams) => { unwrap: () => Promise<void> };
  unbanUser: (params: UnbanMutationParams) => { unwrap: () => Promise<void> };
  chatBanUser: (params: BanMutationParams) => { unwrap: () => Promise<void> };
  chatUnbanUser: (params: UnbanMutationParams) => { unwrap: () => Promise<void> };
};

export const getModerationPermissions = (
  currentUserId: number,
  currentUserRole: string,
  targetUser: TargetUser,
) => {
  const isInvitation = !targetUser.user_id;
  const userId = targetUser.user_id;
  const isBanned = targetUser.is_banned;
  const isChatBanned = targetUser.is_chat_banned;

  return {
    canModerateUser:
      !isInvitation &&
      currentUserId !== userId &&
      (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
      !isBanned,

    canUnbanUser:
      !isInvitation &&
      currentUserId !== userId &&
      (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
      isBanned,

    canChatModerateUser:
      !isInvitation &&
      currentUserId !== userId &&
      (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
      !isBanned,

    canChatUnmuteUser:
      !isInvitation &&
      currentUserId !== userId &&
      (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
      isChatBanned,
  };
};

type ModerationUser = {
  is_banned: boolean;
  is_chat_banned: boolean;
};

export const getModerationStyles = (user: ModerationUser): React.CSSProperties => {
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

export const getModerationRowStyles = (user: ModerationUser): React.CSSProperties => {
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

export const createModerationHandlers = ({
  user,
  currentUserRole,
  banUser,
  unbanUser,
  chatBanUser,
  chatUnbanUser,
}: ModerationHandlersParams) => {
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
        } catch (error: unknown) {
          const apiError = error as { data?: { message?: string } };
          notifications.show({
            title: 'Error',
            message: apiError.data?.message || 'Failed to ban user',
            color: 'red',
          });
        }
      },
      onCancel: () => {},
      children: null,
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
        } catch (error: unknown) {
          const apiError = error as { data?: { message?: string } };
          notifications.show({
            title: 'Error',
            message: apiError.data?.message || 'Failed to unban user',
            color: 'red',
          });
        }
      },
      onCancel: () => {},
      children: null,
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
        } catch (error: unknown) {
          const apiError = error as { data?: { message?: string } };
          notifications.show({
            title: 'Error',
            message: apiError.data?.message || 'Failed to mute user from chat',
            color: 'red',
          });
        }
      },
      onCancel: () => {},
      children: null,
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
        } catch (error: unknown) {
          const apiError = error as { data?: { message?: string } };
          notifications.show({
            title: 'Error',
            message: apiError.data?.message || 'Failed to unmute user from chat',
            color: 'red',
          });
        }
      },
      onCancel: () => {},
      children: null,
    });
  };

  return {
    handleBan,
    handleUnban,
    handleChatBan,
    handleChatUnban,
  };
};
