import { useState, useEffect } from 'react';
import { Tabs, Text, Stack, Loader, Center, Badge } from '@mantine/core';
import { IconHash, IconLock, IconGlobe } from '@tabler/icons-react';
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

  // Extract chat rooms from paginated response
  const rooms = chatRooms?.chat_rooms || [];
  
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

  // Check if room requires admin role
  const isAdminRoom = (room) => {
    return room.room_type === 'ADMIN';
  };

  // Check if user can access room
  const canAccessRoom = (room) => {
    if (!isAdminRoom(room)) return true;
    // TODO: Check user's event role once we have that data
    return true; // For now, allow all
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
              leftSection={
                room.room_type === 'GLOBAL' ? 
                  <IconGlobe size={16} /> : 
                  room.room_type === 'ADMIN' ? 
                    <IconLock size={16} /> : 
                    <IconHash size={16} />
              }
              className={isAdminRoom(room) ? styles.adminTab : undefined}
              disabled={!canAccessRoom(room)}
            >
              {room.name}
              {isAdminRoom(room) && (
                <Badge size="xs" color="red" ml={4}>
                  Admin
                </Badge>
              )}
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