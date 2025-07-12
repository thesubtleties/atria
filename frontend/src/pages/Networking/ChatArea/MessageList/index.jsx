import { useRef, useEffect } from 'react';
import { ScrollArea, Stack, Text, Group, Box } from '@mantine/core';
import { MessageBubble } from '../MessageBubble';
import styles from './styles/index.module.css';

export function MessageList({ room, messages }) {
  const scrollAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Track if user is near bottom of scroll area
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    
    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Consider "near bottom" if within 100px of the bottom
    isNearBottomRef.current = distanceFromBottom < 100;
  };

  return (
    <ScrollArea 
      ref={scrollAreaRef}
      className={styles.messagesArea}
      onScrollPositionChange={handleScroll}
    >
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
        <div ref={messagesEndRef} />
      </Stack>
    </ScrollArea>
  );
}