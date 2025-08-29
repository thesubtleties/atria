import { useEffect, useRef } from 'react';
import { ScrollArea, Text, Group, ActionIcon, Badge } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { LoadingContent } from '../../loading';
import styles from './styles/index.module.css';

/**
 * MessageList component for displaying chat room messages
 * Handles infinite scroll and message display
 */
function MessageList({ 
  messages, 
  canModerate, 
  onDeleteMessage, 
  onLoadMore, 
  isLoadingMore, 
  hasMore,
  scrollAreaRef 
}) {
  const currentUser = useSelector((state) => state.auth.user);
  const viewport = useRef();
  const shouldScrollToBottom = useRef(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldScrollToBottom.current && viewport.current) {
      viewport.current.scrollTop = viewport.current.scrollHeight;
    }
  }, [messages]);

  // Handle scroll for infinite loading
  const handleScroll = () => {
    if (!viewport.current || isLoadingMore || !hasMore) return;

    const { scrollTop } = viewport.current;
    const threshold = 100;
    
    // Check if we're near the top
    if (scrollTop < threshold) {
      shouldScrollToBottom.current = false;
      onLoadMore();
    }

    // Check if we're at the bottom
    const isAtBottom = viewport.current.scrollHeight - viewport.current.scrollTop - viewport.current.clientHeight < 10;
    shouldScrollToBottom.current = isAtBottom;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatUserName = (user) => {
    if (!user) return 'Unknown User';
    return user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Anonymous';
  };

  return (
    <ScrollArea 
      className={styles.messagesArea} 
      ref={scrollAreaRef}
      onScrollPositionChange={handleScroll}
      viewportRef={viewport}
    >
      <div className={styles.messagesList}>
        {isLoadingMore && hasMore && (
          <div className={styles.loadingMore}>
            <LoadingContent message="Loading more messages..." size="xs" showMessage={true} />
          </div>
        )}
        
        {messages.map((message) => {
          // Chat room messages use 'user' field, not 'sender'
          const messageUser = message.user || message.sender;
          const isOwnMessage = currentUser?.id === messageUser?.id;
          const isDeleted = message.is_deleted;
          
          return (
            <div 
              key={message.id} 
              className={`${styles.message} ${isOwnMessage ? styles.ownMessage : ''} ${isDeleted ? styles.deletedMessage : ''}`}
            >
              <div className={styles.messageContent}>
                <Group gap="xs" className={styles.messageHeader}>
                  <Text size="xs" fw={600} className={styles.senderName}>
                    {formatUserName(messageUser)}
                  </Text>
                  {messageUser?.role && (
                    <Badge size="xs" variant="light">
                      {messageUser.role}
                    </Badge>
                  )}
                  <Text size="xs" c="dimmed">
                    {formatTime(message.created_at)}
                  </Text>
                  {canModerate && !isDeleted && (
                    <ActionIcon 
                      size="xs" 
                      variant="subtle" 
                      color="red"
                      onClick={() => onDeleteMessage(message.id)}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  )}
                </Group>
                
                {isDeleted ? (
                  <Text size="sm" c="dimmed" fs="italic">
                    Message deleted by {formatUserName(message.deleted_by)}
                  </Text>
                ) : (
                  <Text size="sm" className={styles.messageText}>
                    {message.content}
                  </Text>
                )}
              </div>
            </div>
          );
        })}
        
        {messages.length === 0 && (
          <div className={styles.emptyMessages}>
            <Text size="sm" c="dimmed" ta="center">
              No messages yet. Start the conversation!
            </Text>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export default MessageList;