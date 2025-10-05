// src/shared/components/chat/MobileChatWindow/index.jsx
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ActionIcon, Text, Group, Avatar } from '@mantine/core';
import { IconX, IconSend } from '@tabler/icons-react';
import { LoadingSpinner, LoadingContent } from '../../loading';
import { useSocketMessages } from '../../../hooks/useSocketMessages';
import { useChatScroll } from '../../../hooks/useChatScroll';
import { useDMTyping } from '../../../hooks/useDMTyping';
import { useMobileInputHandler } from '@/shared/hooks/useMobileInputHandler';
import ChatMessage from '../ChatMessage';
import TypingIndicator from '../TypingIndicator';
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

  // Typing indicator hook
  const { isOtherUserTyping, setTyping } = useDMTyping(
    threadId,
    currentUser?.id
  );

  // Use shared scroll logic
  const { messagesEndRef, messagesContainerRef } = useChatScroll({
    messages,
    isLoading,
    isFetching,
    hasMore,
    loadMoreMessages,
    threadId,
  });

  // Auto-scroll when typing indicator appears/disappears (only if near bottom)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !messagesEndRef.current) return;

    // Check if user is near bottom (within 100px)
    const threshold = 100;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    // Only scroll if user is already at bottom
    if (isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOtherUserTyping]);


  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setTyping(false);
    }
  };

  // Use mobile input handler hook
  const { 
    handleKeyDown, 
    handleSendClick, 
    handleFocus, 
    handleBlur 
  } = useMobileInputHandler(handleSendMessage, messageInput, !!otherUser);

  if (isLoading && messages.length === 0) {
    return (
      <div className={styles.mobileWindow}>
        <div className={styles.header}>
          <Text size="sm">Loading chat...</Text>
          <ActionIcon variant="subtle" color="gray" onClick={onClose}>
            <IconX size={20} />
          </ActionIcon>
        </div>
        <div className={styles.loadingState}>
          <LoadingContent showMessage={false} size="lg" />
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
              {otherUser?.full_name || 'Loading chat...'}
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
            <LoadingSpinner size="sm" />
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isCurrentUser={message.sender_id === currentUser?.id}
          />
        ))}
        {isOtherUserTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={styles.inputContainer}>
        <textarea
          value={messageInput}
          onChange={(e) => {
            setMessageInput(e.target.value);
            setTyping(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={`Message ${otherUser?.first_name || ''}...`}
          className={styles.input}
          rows={1}
          disabled={!otherUser}
        />
        <ActionIcon
          color="gray"
          variant="light"
          radius="xl"
          onClick={handleSendClick}
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