// src/shared/components/chat/MobileChatWindow/index.jsx
import { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ActionIcon, Text, Group, Avatar, Loader } from '@mantine/core';
import { IconX, IconSend } from '@tabler/icons-react';
import { useSocketMessages } from '../../../hooks/useSocketMessages';
import ChatMessage from '../ChatMessage';
import { selectUser } from '@/app/store/authSlice';
import styles from './styles/index.module.css';

/**
 * Full-screen mobile chat window
 * Takes entire viewport (minus top nav)
 * Shows one conversation at a time
 */
function MobileChatWindow({ threadId, onClose }) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollState = useRef({
    isNearBottom: true,
    scrollBeforeLoad: null,
    hasInitialized: false,
    scrollTimeout: null
  });
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

  // Auto-scroll to bottom for new messages (only if user is near bottom)
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messagesEndRef.current) {
      // Initial load or user is near bottom
      if (!scrollState.current.hasInitialized || scrollState.current.isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isLoading]);

  // Set initialized flag after delay when thread changes
  useEffect(() => {
    // Reset initialization flag when thread changes
    scrollState.current.hasInitialized = false;
    
    // Set initialized after a delay to avoid triggering on initial scroll
    const initTimer = setTimeout(() => {
      scrollState.current.hasInitialized = true;
    }, 500);

    return () => clearTimeout(initTimer);
  }, [threadId]);

  // Handle scroll to load more messages with position restoration
  useEffect(() => {
    const handleScroll = () => {
      const container = messagesContainerRef.current;
      if (!container) return;

      // Don't process scroll events until we've initialized
      if (!scrollState.current.hasInitialized) {
        return;
      }

      // Track if user is near bottom
      const threshold = 100;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      scrollState.current.isNearBottom = isNearBottom;

      // Check if we should load more (25% from top)
      const scrollPercentage = container.scrollTop / container.scrollHeight;
      if (scrollPercentage < 0.25 && hasMore && !isFetching && !scrollState.current.scrollTimeout) {
        // Debounce scroll loading
        scrollState.current.scrollTimeout = setTimeout(() => {
          // Save scroll position before loading
          const firstMessage = container.querySelector('[data-message-id]');
          if (firstMessage) {
            scrollState.current.scrollBeforeLoad = {
              messageId: firstMessage.dataset.messageId,
              offsetTop: firstMessage.offsetTop,
              scrollTop: container.scrollTop
            };
          }
          
          loadMoreMessages();
          scrollState.current.scrollTimeout = null;
        }, 300);
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (scrollState.current.scrollTimeout) {
        clearTimeout(scrollState.current.scrollTimeout);
      }
    };
  }, [hasMore, isFetching, loadMoreMessages]);

  // Restore scroll position after loading more messages
  useEffect(() => {
    if (scrollState.current.scrollBeforeLoad && !isFetching) {
      const container = messagesContainerRef.current;
      if (container) {
        const savedState = scrollState.current.scrollBeforeLoad;
        const targetMessage = container.querySelector(`[data-message-id="${savedState.messageId}"]`);
        
        if (targetMessage) {
          const newOffsetTop = targetMessage.offsetTop;
          const scrollAdjustment = newOffsetTop - savedState.offsetTop;
          container.scrollTop = savedState.scrollTop + scrollAdjustment;
        }
        
        scrollState.current.scrollBeforeLoad = null;
      }
    }
  }, [messages, isFetching]);

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