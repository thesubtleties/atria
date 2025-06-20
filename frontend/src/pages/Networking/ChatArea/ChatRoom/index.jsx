import { useEffect } from 'react';
import { ScrollArea, TextInput, ActionIcon, Stack, Text, Center, Loader, Group, Box } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useGetChatRoomMessagesQuery } from '@/app/features/chat/api';
import { setActiveChatRoom } from '@/app/features/networking/socketClient';
import { MessageBubble } from '../MessageBubble';
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
      <ScrollArea className={styles.messagesArea}>
        <Stack gap="sm" p="md">
          {room.description && (
            <Text size="sm" c="dimmed" ta="center" py="xs">
              {room.description}
            </Text>
          )}
          {/* TODO: Enable when backend supports room presence tracking
          {data?.active_users !== undefined && (
            <Group justify="center" gap="xs" mb="sm">
              <Box className={styles.presenceIndicator} />
              <Text size="sm" c="dimmed">
                {data.active_users} {data.active_users === 1 ? 'person is' : 'people are'} here
              </Text>
            </Group>
          )}
          */}
          {messages.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="lg">
              No messages yet. Be the first to say hello!
            </Text>
          ) : (
            messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
              />
            ))
          )}
        </Stack>
      </ScrollArea>

      <div className={styles.inputArea}>
        <TextInput
          placeholder={`Message #${room.name}`}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage();
            }
          }}
          rightSection={
            <ActionIcon 
              onClick={onSendMessage}
              disabled={!inputValue?.trim()}
              size="lg"
            >
              <IconSend size={18} />
            </ActionIcon>
          }
          className={styles.input}
        />
      </div>
    </div>
  );
}