import { useEffect } from 'react';
import { Text, Center } from '@mantine/core';
import { useGetChatRoomsQuery } from '@/app/features/chat/api';
import { useGetEventQuery } from '@/app/features/events/api';
import {
  joinEventNotifications,
  leaveEventNotifications,
} from '@/app/features/networking/socketClient';
import { LoadingSpinner } from '../../loading';
import ChatRoomPreview from '../ChatRoomPreview';
import styles from './styles/index.module.css';
import type { ChatRoom } from '@/types/chat';

/** Extended ChatRoom with optional runtime properties */
interface ChatRoomWithExtras extends ChatRoom {
  message_count?: number;
  last_message?: {
    content: string;
  } | null;
  subtype?: string;
  unread_count?: number;
}

/** Props for ChatRoomList component */
interface ChatRoomListProps {
  eventId: number;
  onRoomClick: (room: ChatRoomWithExtras) => void;
  activeChatRoomId?: number | null;
}

/** Response shape that may come from the API */
interface ChatRoomsResponse {
  chat_rooms?: ChatRoomWithExtras[];
}

/** Extended event data with ban info */
interface EventDataWithBanInfo {
  is_banned?: boolean;
  is_chat_banned?: boolean;
}

/** Room type order for sorting */
const ROOM_TYPE_ORDER: Record<string, number> = {
  GLOBAL: 1,
  GREEN_ROOM: 2,
  ADMIN: 3,
};

/**
 * ChatRoomList component displays all available chat rooms for an event
 * Shows them as thread-like previews that can be clicked to open
 */
function ChatRoomList({ eventId, onRoomClick, activeChatRoomId }: ChatRoomListProps) {
  const { data: chatRooms, isLoading } = useGetChatRoomsQuery(eventId, {
    skip: !eventId,
  });

  const { data: eventData } = useGetEventQuery(
    { id: eventId },
    {
      skip: !eventId,
    },
  );

  // Join event notifications for real-time updates
  useEffect(() => {
    if (eventId) {
      joinEventNotifications(eventId);

      return () => {
        leaveEventNotifications(eventId);
      };
    }
  }, [eventId]);

  // Extract and sort chat rooms
  // Handle both array and object response formats
  const rawRooms: ChatRoomWithExtras[] =
    Array.isArray(chatRooms) ? chatRooms : (
      (chatRooms as unknown as ChatRoomsResponse)?.chat_rooms || []
    );

  // Sort rooms: GLOBAL first, then GREEN_ROOM, then ADMIN
  const sortedRooms = [...rawRooms].sort((a, b) => {
    const typeCompare =
      (ROOM_TYPE_ORDER[a.room_type] || 999) - (ROOM_TYPE_ORDER[b.room_type] || 999);
    if (typeCompare !== 0) return typeCompare;

    return a.display_order - b.display_order;
  });

  if (isLoading) {
    return (
      <Center className={styles.loadingContainer ?? ''}>
        <LoadingSpinner size='sm' />
      </Center>
    );
  }

  if (!sortedRooms.length) {
    return (
      <div className={styles.emptyState}>
        <Text size='sm' c='dimmed' ta='center'>
          No chat rooms available
        </Text>
      </div>
    );
  }

  // Check if chat is restricted
  // Cast to extended type since the API may return ban info not in the local Event type
  const eventWithBanInfo = eventData as EventDataWithBanInfo | undefined;
  const isChatRestricted =
    eventWithBanInfo && (eventWithBanInfo.is_banned || eventWithBanInfo.is_chat_banned);

  if (isChatRestricted) {
    return (
      <div className={styles.restrictedState}>
        <Text size='sm' c='dimmed' ta='center'>
          Chat access is restricted
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.roomList}>
      {sortedRooms.map((room) => (
        <ChatRoomPreview
          key={room.id}
          room={room}
          isActive={room.id === activeChatRoomId}
          onClick={() => onRoomClick(room)}
          messageCount={room.message_count || 0}
        />
      ))}
    </div>
  );
}

export default ChatRoomList;
