import { useState, useEffect } from 'react';
import { Tabs, Text, Stack, Loader, Center, Badge } from '@mantine/core';
import { IconHash, IconLock, IconGlobe, IconMicrophone } from '@tabler/icons-react';
import { useGetChatRoomsQuery, useSendMessageMutation } from '@/app/features/chat/api';
import { joinEventNotifications, leaveEventNotifications } from '@/app/features/networking/socketClient';
import { ChatRoom } from './ChatRoom';
import styles from './styles/index.module.css';

export function ChatArea({ eventId }) {
  console.log('ChatArea component mounting with eventId:', eventId);
  
  const [activeRoom, setActiveRoom] = useState(null);
  const [inputValues, setInputValues] = useState({});
  
  console.log('About to call useGetChatRoomsQuery with eventId:', eventId, 'type:', typeof eventId);
  
  const { data: chatRooms, isLoading, error } = useGetChatRoomsQuery(eventId, {
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

  useEffect(() => {
    if (rooms.length > 0 && !activeRoom) {
      setActiveRoom(rooms[0].id);
    }
  }, [rooms, activeRoom]);

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
        <Loader size="lg" />
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
  const canAccessRoom = (room) => {
    // For now, allow all rooms that are returned from the API
    // The backend already filters based on permissions
    return true;
  };

  return (
    <div className={styles.container}>
      <Tabs 
        value={activeRoom?.toString()} 
        onChange={(value) => setActiveRoom(parseInt(value))}
        className={styles.tabs}
      >
        <Tabs.List className={styles.tabsList}>
          {rooms.map(room => (
            <Tabs.Tab 
              key={room.id} 
              value={room.id.toString()}
              className={styles.tab}
              leftSection={getRoomIcon(room.room_type)}
              disabled={!canAccessRoom(room)}
            >
              <span className={styles.tabContent}>
                {room.name}
                {room.room_type !== 'GLOBAL' && (() => {
                  const typeLabel = getRoomTypeLabel(room);
                  return typeLabel ? (
                    <span className={`${styles.roomTypeLabel} ${typeLabel.className}`}>
                      {typeLabel.label}
                    </span>
                  ) : null;
                })()}
              </span>
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {rooms.map(room => (
          <Tabs.Panel 
            key={room.id} 
            value={room.id.toString()} 
            className={styles.tabPanel}
          >
            {canAccessRoom(room) ? (
              <ChatRoom 
                room={room} 
                eventId={eventId}
                inputValue={inputValues[room.id] || ''}
                onInputChange={(value) => setInputValues(prev => ({ 
                  ...prev, 
                  [room.id]: value 
                }))}
                onSendMessage={() => handleSendMessage(room.id)}
              />
            ) : (
              <Center className={styles.restricted}>
                <Stack align="center" spacing="sm">
                  <IconLock size={48} />
                  <Text>This chat room is restricted to administrators</Text>
                </Stack>
              </Center>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}