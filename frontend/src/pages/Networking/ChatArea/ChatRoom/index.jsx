import { useEffect } from 'react';
import { ScrollArea, TextInput, ActionIcon, Stack, Text, Center, Loader } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useGetChatRoomMessagesQuery } from '@/app/features/chat/api';
import { useSocketMessages } from '@/shared/hooks/useSocketMessages';
import { MessageBubble } from '../MessageBubble';
import styles from './styles/index.module.css';

export function ChatRoom({ 
  room, 
  eventId, 
  inputValue, 
  onInputChange, 
  onSendMessage, 
  messages: localMessages, 
  onNewMessage 
}) {
  const { data, isLoading } = useGetChatRoomMessagesQuery(
    { chatRoomId: room.id, limit: 100 },
    { skip: !room.id }
  );

  // Combine API messages with local messages
  // API messages are older, so they come first
  const allMessages = [
    ...(data?.messages || []),
    ...(localMessages || [])
  ];

  // Set up socket message handling for this room
  useSocketMessages((message) => {
    if (message.room_id === room.id && onNewMessage) {
      onNewMessage(message);
    }
  });

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
          {allMessages.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="lg">
              No messages yet. Be the first to say hello!
            </Text>
          ) : (
            allMessages.map((message, index) => (
              <MessageBubble 
                key={message.id || `local-${index}`} 
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