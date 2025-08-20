// src/shared/components/chat/MobileChatWindow/index.jsx
import { useSelector } from 'react-redux';
import { ActionIcon, Text, Group, Avatar, Loader } from '@mantine/core';
import { IconX, IconSend } from '@tabler/icons-react';
import { useSocketMessages } from '../../../hooks/useSocketMessages';
import { useChatScroll } from '../../../hooks/useChatScroll';
import ChatMessage from '../ChatMessage';
import { selectUser } from '@/app/store/authSlice';
import styles from './styles/index.module.css';

/**
 * Full-screen mobile chat window
 * Takes entire viewport (minus top nav)
 * Shows one conversation at a time
 */
function MobileChatWindow({ threadId, onClose }) {
  const currentUser = useSelector(selectUser);
  const {
    messages,
    otherUser,
    isEncrypted,
    isLoading,
    messageInput,
    setMessageInput,
    sendMessage,
    hasMore,
    loadMoreMessages,
    isFetching,
  } = useSocketMessages(threadId);

  // Use shared scroll logic
  const { messagesEndRef, messagesContainerRef } = useChatScroll({
    messages,
    isLoading,
    isFetching,
    hasMore,
    loadMoreMessages,
    threadId,
  });


  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className={styles.mobileWindow}>
        <div className={styles.header}>
          <Text size="sm">Loading...</Text>
          <ActionIcon variant="subtle" color="gray" onClick={onClose}>
            <IconX size={20} />
          </ActionIcon>
        </div>
        <div className={styles.loadingState}>
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mobileWindow}>
      {/* Chat Header */}
      <div className={styles.header}>
        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
          <Avatar 
            src={otherUser?.image_url} 
            radius="xl" 
            size="sm" 
          />
          <div className={styles.userInfo}>
            <Text size="sm" fw={500} lineClamp={1}>
              {otherUser?.full_name || 'Loading...'}
            </Text>
            {isEncrypted && (
              <Text size="xs" c="dimmed">
                End-to-end encrypted
              </Text>
            )}
          </div>
        </Group>
        
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={onClose}
          className={styles.closeButton}
        >
          <IconX size={20} />
        </ActionIcon>
      </div>

      {/* Messages Container */}
      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {/* Loading indicator for pagination */}
        {isFetching && hasMore && (
          <div className={styles.loadingMore}>
            <Loader size="sm" />
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isCurrentUser={message.sender_id === currentUser?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={styles.inputContainer}>
        <textarea
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`Message ${otherUser?.first_name || ''}...`}
          className={styles.input}
          rows={1}
          disabled={!otherUser}
        />
        <ActionIcon
          color="gray"
          variant="light"
          radius="xl"
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || !otherUser}
          className={styles.sendButton}
        >
          <IconSend size={16} />
        </ActionIcon>
      </div>
    </div>
  );
}

export default MobileChatWindow;