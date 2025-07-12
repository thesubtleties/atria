import { useEffect } from 'react';
import { Center, Loader } from '@mantine/core';
import { useGetChatRoomMessagesQuery } from '@/app/features/chat/api';
import { setActiveChatRoom } from '@/app/features/networking/socketClient';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import styles from './styles/index.module.css';

export function ChatRoom({ 
  room, 
  eventId, 
  inputValue, 
  onInputChange, 
  onSendMessage
}) {
  const { data, isLoading } = useGetChatRoomMessagesQuery(
    { chatRoomId: room.id, limit: 100, offset: 0 },
    { skip: !room.id }
  );

  // Get messages from API
  const messages = data?.messages || [];

  // Set up socket subscription for this room
  useEffect(() => {
    let isMounted = true;
    
    const setupRoom = async () => {
      if (room?.id && isMounted) {
        console.log('🟡 ChatRoom: Setting up active chat room:', room.id);
        
        try {
          // This will now wait for socket connection before joining
          await setActiveChatRoom(room.id);
          console.log('🟡 ChatRoom: Successfully joined room:', room.id);
          
          // Debug: Check socket status after joining
          const module = await import('@/app/features/networking/socketClient');
          const socket = module.getSocket();
          console.log('🟡 ChatRoom: Socket status after join:', {
            exists: !!socket,
            connected: socket?.connected,
            id: socket?.id
          });
        } catch (error) {
          console.error('🟡 ChatRoom: Failed to join room:', error);
        }
      }
    };
    
    setupRoom();
    
    // Cleanup: leave room when component unmounts or room changes
    return () => {
      isMounted = false;
      if (room?.id) {
        console.log('🟡 ChatRoom: Clearing active chat room:', room.id);
        setActiveChatRoom(null);
      }
    };
  }, [room?.id]);

  if (isLoading) {
    return (
      <Center className={styles.chatContainer}>
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <MessageList 
        room={room}
        messages={messages}
      />
      
      <MessageInput 
        roomName={room.name}
        value={inputValue}
        onChange={onInputChange}
        onSend={onSendMessage}
      />
    </div>
  );
}