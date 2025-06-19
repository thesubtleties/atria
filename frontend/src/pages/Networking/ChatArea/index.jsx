import { useState, useEffect } from 'react';
import { Tabs, Text, Stack, Loader, Center, Badge } from '@mantine/core';
import { IconHash, IconLock, IconGlobe } from '@tabler/icons-react';
import { useGetChatRoomsQuery, useSendMessageMutation } from '@/app/features/chat/api';
import { ChatRoom } from './ChatRoom';
import styles from './styles/index.module.css';

export function ChatArea({ eventId }) {
  console.log('ChatArea component mounting with eventId:', eventId);
  
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState({});
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

  const handleSendMessage = async (roomId) => {
    const content = inputValues[roomId]?.trim();
    if (!content) return;

    try {
      await sendMessage({ 
        chatRoomId: roomId, 
        content 
      }).unwrap();
      
      setInputValues(prev => ({ ...prev, [roomId]: '' }));
    } catch (error) {
      console.error('Failed to send message:', error);
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
    return room.name?.toLowerCase().includes('admin') || 
           room.name?.toLowerCase().includes('organizer');
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
                room.is_global ? 
                  <IconGlobe size={16} /> : 
                  isAdminRoom(room) ? 
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
                messages={messages[room.id]}
                onNewMessage={(message) => {
                  setMessages(prev => ({
                    ...prev,
                    [room.id]: [...(prev[room.id] || []), message]
                  }));
                }}
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