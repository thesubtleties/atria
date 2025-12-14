import { useEffect } from 'react';
import { Text, Center } from '@mantine/core';
import { useGetSessionChatRoomsQuery } from '@/app/features/chat/api';
import { useGetSessionQuery } from '@/app/features/sessions/api';
import { useGetEventQuery } from '@/app/features/events/api';
import {
  joinSessionChatRooms,
  leaveSessionChatRooms,
} from '@/app/features/networking/socketClient';
import { LoadingSpinner } from '../../loading';
import ChatRoomPreview from '../ChatRoomPreview';
import type { SessionChatRoom } from '@/types/chat';
import styles from './styles/index.module.css';

/** Extended event data that includes user-specific ban status */
interface EventDataWithBanStatus {
  id: number;
  name: string;
  event_id: number;
  is_banned?: boolean;
  is_chat_banned?: boolean;
}

interface SessionChatRoomListProps {
  sessionId: number | string | null;
  onRoomClick: (room: SessionChatRoom) => void;
  activeChatRoomId: number | null;
}

/**
 * SessionChatRoomList component displays chat rooms for a specific session
 * Shows PUBLIC and BACKSTAGE rooms based on user permissions
 */
function SessionChatRoomList({
  sessionId,
  onRoomClick,
  activeChatRoomId,
}: SessionChatRoomListProps) {
  const sessionIdNum = sessionId ? parseInt(String(sessionId)) : null;
  console.log('SessionChatRoomList - sessionId:', sessionId, 'sessionIdNum:', sessionIdNum);

  const { data: sessionData } = useGetSessionQuery(
    { id: sessionIdNum! },
    {
      skip: !sessionIdNum,
    },
  );

  const { data: eventData } = useGetEventQuery(
    { id: sessionData?.event_id ?? 0 },
    {
      skip: !sessionData?.event_id,
    },
  ) as { data: EventDataWithBanStatus | undefined };

  const {
    data: chatRooms,
    isLoading,
    error,
  } = useGetSessionChatRoomsQuery(sessionIdNum!, {
    skip: !sessionIdNum,
  });

  console.log('Session chat rooms query:', { sessionIdNum, chatRooms, isLoading, error });

  // Join/leave session chat rooms via socket
  useEffect(() => {
    if (sessionIdNum) {
      joinSessionChatRooms(sessionIdNum);

      return () => {
        leaveSessionChatRooms(sessionIdNum);
      };
    }
  }, [sessionIdNum]);

  // Extract chat rooms from response
  // The response might be an array directly or wrapped in an object
  const rooms: SessionChatRoom[] =
    Array.isArray(chatRooms) ? chatRooms : (
      (chatRooms as { chat_rooms: SessionChatRoom[] } | undefined)?.chat_rooms || []
    );
  console.log('Extracted rooms:', rooms);

  // Sort rooms by display_order
  const sortedRooms = [...rooms].sort((a, b) => {
    // Sort by display_order
    return a.display_order - b.display_order;
  });

  console.log('Sorted session rooms:', sortedRooms);

  // The backend filters rooms based on user permissions
  // Frontend displays all rooms returned by the API
  const accessibleRooms = sortedRooms;

  if (isLoading) {
    return (
      <Center className={styles.loadingContainer ?? ''}>
        <LoadingSpinner size='sm' />
      </Center>
    );
  }

  if (!accessibleRooms.length) {
    return (
      <div className={styles.emptyState}>
        <Text size='sm' c='dimmed' ta='center'>
          No chat rooms available for this session
        </Text>
      </div>
    );
  }

  // Check if chat is restricted
  const isChatRestricted = eventData && (eventData.is_banned || eventData.is_chat_banned);

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
    <div className={styles.sessionInfo}>
      {/* Session title header */}
      {sessionData && (
        <div className={styles.sessionHeader}>
          <Text size='xs' fw={600} c='dimmed'>
            {sessionData.title}
          </Text>
        </div>
      )}

      <div className={styles.roomList}>
        {accessibleRooms.map((room) => (
          <ChatRoomPreview
            key={room.id}
            room={room}
            isActive={room.id === activeChatRoomId}
            onClick={() => onRoomClick(room)}
            messageCount={room.message_count || 0}
          />
        ))}
      </div>
    </div>
  );
}

export default SessionChatRoomList;
