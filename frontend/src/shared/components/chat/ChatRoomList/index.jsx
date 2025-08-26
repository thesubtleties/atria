import { useEffect } from 'react';
import { Text, Loader, Center } from '@mantine/core';
import { useGetChatRoomsQuery } from '@/app/features/chat/api';
import { useGetEventQuery } from '@/app/features/events/api';
import { joinEventNotifications, leaveEventNotifications } from '@/app/features/networking/socketClient';
import ChatRoomPreview from '../ChatRoomPreview';
import styles from './styles/index.module.css';

/**
 * ChatRoomList component displays all available chat rooms for an event
 * Shows them as thread-like previews that can be clicked to open
 */
function ChatRoomList({ eventId, onRoomClick, activeChatRoomId }) {
  const { data: chatRooms, isLoading } = useGetChatRoomsQuery(eventId, {
    skip: !eventId
  });
  
  const { data: eventData } = useGetEventQuery(eventId, {
    skip: !eventId
  });

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
  const rawRooms = Array.isArray(chatRooms) ? chatRooms : (chatRooms?.chat_rooms || []);
  
  // Sort rooms: GLOBAL first, then GREEN_ROOM, then ADMIN
  const sortedRooms = [...rawRooms].sort((a, b) => {
    const typeOrder = { 'GLOBAL': 1, 'GREEN_ROOM': 2, 'ADMIN': 3 };
    
    const typeCompare = (typeOrder[a.room_type] || 999) - (typeOrder[b.room_type] || 999);
    if (typeCompare !== 0) return typeCompare;
    
    return a.display_order - b.display_order;
  });

  if (isLoading) {
    return (
      <Center className={styles.loadingContainer}>
        <Loader size="sm" />
      </Center>
    );
  }

  if (!sortedRooms.length) {
    return (
      <div className={styles.emptyState}>
        <Text size="sm" c="dimmed" ta="center">
          No chat rooms available
        </Text>
      </div>
    );
  }

  // Check if chat is restricted
  const isChatRestricted = eventData && (eventData.is_banned || eventData.is_chat_banned);

  if (isChatRestricted) {
    return (
      <div className={styles.restrictedState}>
        <Text size="sm" c="dimmed" ta="center">
          Chat access is restricted
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.roomList}>
      {sortedRooms.map(room => (
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