import { useState, useEffect } from 'react';
import { Text, Stack, Center } from '@mantine/core';
import { LoadingSpinner } from '../../../shared/components/loading';
import { IconHash, IconLock, IconGlobe, IconMicrophone } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { useGetChatRoomsQuery, useSendMessageMutation } from '@/app/features/chat/api';
import { useGetEventQuery } from '@/app/features/events/api';
import { joinEventNotifications, leaveEventNotifications } from '@/app/features/networking/socketClient';
import { ChatRoom } from './ChatRoom';
import styles from './styles/index.module.css';

export function ChatArea({ eventId }) {
  console.log('ChatArea component mounting with eventId:', eventId);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeRoom, setActiveRoom] = useState(null);
  const [inputValues, setInputValues] = useState({});
  
  console.log('About to call useGetChatRoomsQuery with eventId:', eventId, 'type:', typeof eventId);
  
  const { data: chatRooms, isLoading, error } = useGetChatRoomsQuery(eventId, {
    skip: !eventId
  });
  const { data: eventData } = useGetEventQuery(eventId, {
    skip: !eventId
  });
  const [sendMessage] = useSendMessageMutation();

  // Extract chat rooms from paginated response and sort them
  const rawRooms = chatRooms?.chat_rooms || [];
  
  // Sort rooms: GLOBAL (general) first, then GREEN_ROOM (speakers), then ADMIN
  const rooms = [...rawRooms].sort((a, b) => {
    // Define the order of room types
    const typeOrder = { 'GLOBAL': 1, 'GREEN_ROOM': 2, 'ADMIN': 3 };
    
    // First sort by room type
    const typeCompare = (typeOrder[a.room_type] || 999) - (typeOrder[b.room_type] || 999);
    if (typeCompare !== 0) return typeCompare;
    
    // Then sort by display_order within the same type
    return a.display_order - b.display_order;
  });
  
  console.log('ChatArea API response:', { eventId, chatRooms, rooms, isLoading, error });

  // Determine if current user can moderate messages
  const canModerate = eventData?.user_role === 'ADMIN' || eventData?.user_role === 'ORGANIZER';
  
  // Check if current user can send chat messages (not banned or chat-banned)
  const canSendMessages = eventData && !eventData.is_banned && !eventData.is_chat_banned;

  // Initialize active room from URL param or first room (only on mount and rooms change)
  useEffect(() => {
    const roomParam = searchParams.get('room');
    
    if (rooms.length > 0) {
      if (roomParam) {
        // Check if the room from URL exists
        const roomExists = rooms.some(r => r.id === parseInt(roomParam));
        if (roomExists) {
          const roomId = parseInt(roomParam);
          if (activeRoom !== roomId) {
            console.log('Setting active room from URL:', roomId);
            setActiveRoom(roomId);
          }
        } else {
          // Room doesn't exist, use first room
          if (activeRoom !== rooms[0].id) {
            setActiveRoom(rooms[0].id);
          }
        }
      } else if (!activeRoom) {
        // No room param and no active room, use first room
        setActiveRoom(rooms[0].id);
      }
    }
  }, [rooms, activeRoom]); // Only depend on rooms changing, not searchParams
  
  // Listen for URL changes (browser back/forward)
  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam && rooms.length > 0) {
      const roomId = parseInt(roomParam);
      const roomExists = rooms.some(r => r.id === roomId);
      if (roomExists && activeRoom !== roomId) {
        console.log('URL changed, updating active room to:', roomId);
        setActiveRoom(roomId);
      }
    }
  }, [searchParams]);

  // Update URL when room changes (but not from URL updates)
  const handleRoomChange = (roomId) => {
    console.log('Switching to room:', roomId);
    setActiveRoom(roomId);
    
    // Update URL
    const newParams = new URLSearchParams(searchParams);
    newParams.set('room', roomId.toString());
    setSearchParams(newParams, { replace: true });
  };

  // Join event notifications for chat updates
  useEffect(() => {
    if (eventId) {
      console.log('Joining event notifications for eventId:', eventId);
      joinEventNotifications(eventId);
      
      return () => {
        console.log('Leaving event notifications for eventId:', eventId);
        leaveEventNotifications(eventId);
      };
    }
  }, [eventId]);

  const handleSendMessage = async (roomId) => {
    const content = inputValues[roomId]?.trim();
    if (!content) return;

    console.log('📤 Sending message to room:', roomId, 'Content:', content);
    
    try {
      // Use REST API to send (backend will emit Socket.IO event)
      const result = await sendMessage({ 
        chatRoomId: roomId, 
        content 
      }).unwrap();
      
      console.log('📤 Message sent successfully:', result);
      setInputValues(prev => ({ ...prev, [roomId]: '' }));
    } catch (error) {
      console.error('📤 Failed to send message:', error);
    }
  };

  if (isLoading) {
    return (
      <Center className={styles.loader}>
        <LoadingSpinner size="lg" />
      </Center>
    );
  }
  
  if (!rooms.length) {
    return (
      <Center className={styles.empty}>
        <Text c="dimmed">No chat rooms available for this event</Text>
      </Center>
    );
  }

  // Get icon for room type
  const getRoomIcon = (roomType) => {
    switch (roomType) {
      case 'GLOBAL':
        return <IconGlobe size={16} />;
      case 'ADMIN':
        return <IconLock size={16} />;
      case 'GREEN_ROOM':
        return <IconMicrophone size={16} />;
      default:
        return <IconHash size={16} />;
    }
  };

  // Get room type label and styling
  const getRoomTypeLabel = (room) => {
    switch (room.room_type) {
      case 'ADMIN':
        return { label: 'Admin', className: styles.adminLabel };
      case 'GREEN_ROOM':
        return { label: 'Speakers', className: styles.speakerLabel };
      default:
        return null;
    }
  };

  // Check if user can access room
  const canAccessRoom = () => {
    // For now, allow all rooms that are returned from the API
    // The backend already filters based on permissions
    return true;
  };

  return (
    <div className={styles.container}>
      <div className={styles.customTabs}>
        {/* Custom room tabs */}
        <div className={styles.roomTabsList}>
          {rooms.map(room => {
            const typeLabel = getRoomTypeLabel(room);
            const isActive = activeRoom === room.id;
            
            return (
              <button
                key={room.id}
                className={`${styles.roomTab} ${isActive ? styles.roomTabActive : ''}`}
                onClick={() => handleRoomChange(room.id)}
                disabled={!canAccessRoom()}
              >
                {getRoomIcon(room.room_type)}
                <span>{room.name}</span>
                {room.room_type !== 'GLOBAL' && typeLabel && (
                  <span className={`${styles.roomTypeLabel} ${typeLabel.className}`}>
                    {typeLabel.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chat content area */}
        <div className={styles.chatContent}>
          {rooms.map(room => {
            if (activeRoom !== room.id) return null;
            
            return (
              <div key={room.id} className={styles.chatPanel}>
                {canAccessRoom() ? (
                  <ChatRoom 
                    room={room} 
                    eventId={eventId}
                    inputValue={inputValues[room.id] || ''}
                    onInputChange={(value) => setInputValues(prev => ({ 
                      ...prev, 
                      [room.id]: value 
                    }))}
                    onSendMessage={() => handleSendMessage(room.id)}
                    canModerate={canModerate}
                    canSendMessages={canSendMessages}
                    isActive={activeRoom === room.id}
                  />
                ) : (
                  <Center className={styles.restricted}>
                    <Stack align="center" spacing="sm">
                      <IconLock size={48} />
                      <Text>This chat room is restricted to administrators</Text>
                    </Stack>
                  </Center>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}