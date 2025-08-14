// src/shared/components/chat/ChatWindow/index.jsx
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ActionIcon, Avatar, Text, Group, Loader } from '@mantine/core';
import {
  IconX,
  IconMinimize,
  IconMaximize,
  IconSend,
} from '@tabler/icons-react';
import {
  closeThread,
  minimizeThread,
  maximizeThread,
} from '../../../../app/store/chatSlice';
import { useSocketMessages } from '../../../hooks/useSocketMessages';
import ChatMessage from '../ChatMessage';
import { selectUser } from '@/app/store/authSlice';
import styles from './styles/index.module.css';

function ChatWindow({ threadId }) {
  const dispatch = useDispatch();
  const [isMaximized, setIsMaximized] = useState(false);
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
    isLoading,
    isFetching,
    messageInput,
    setMessageInput,
    sendMessage,
    hasMore,
    loadMoreMessages,
  } = useSocketMessages(threadId);

  // Scroll to bottom on new messages (only if user is near bottom)
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messagesEndRef.current) {
      // Initial load or user is near bottom
      if (!scrollState.current.hasInitialized || scrollState.current.isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isLoading]);

  // Set initialized flag after a delay when thread changes
  useEffect(() => {
    // Reset initialization flag when thread changes
    scrollState.current.hasInitialized = false;
    
    // Set initialized after a delay to avoid triggering on initial scroll
    const initTimer = setTimeout(() => {
      scrollState.current.hasInitialized = true;
    }, 500);

    return () => clearTimeout(initTimer);
  }, [threadId]);

  // Handle scroll to load more messages with better position restoration
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

  // Handle window controls
  const handleClose = () => {
    dispatch(closeThread(threadId));
  };

  const handleMinimize = () => {
    dispatch(minimizeThread(threadId));
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    dispatch(maximizeThread(threadId));
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
  };

  // Handle enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div
        className={`${styles.chatWindow} ${isMaximized ? styles.maximized : ''}`}
      >
        <div className={styles.header}>
          <Text size="sm">Loading...</Text>
          <Group gap="xs">
            <ActionIcon size="xs" onClick={handleClose}>
              <IconX size={14} />
            </ActionIcon>
          </Group>
        </div>
        <div className={styles.loading}>
          <Loader size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.chatWindow} ${isMaximized ? styles.maximized : ''}`}
    >
      {/* Header */}
      <div className={styles.header} onClick={handleMinimize}>
        <Group gap="sm">
          <Avatar src={otherUser?.image_url} radius="xl" size="sm" />
          <Text size="sm" fw={500}>
            {otherUser?.full_name || 'Chat'}
          </Text>
        </Group>
        <Group gap="xs">
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            className={styles.headerAction}
            onClick={(e) => {
              e.stopPropagation();
              handleMaximize();
            }}
          >
            {isMaximized ? (
              <IconMinimize size={14} />
            ) : (
              <IconMaximize size={14} />
            )}
          </ActionIcon>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            className={styles.headerAction}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            <IconX size={14} />
          </ActionIcon>
        </Group>
      </div>

      {/* Messages */}
      <div className={styles.messages} ref={messagesContainerRef}>
        {/* Loading indicator for pagination */}
        {isFetching && hasMore && (
          <div className={styles.loadingMore}>
            <Loader size="xs" />
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

      {/* Input */}
      <div className={styles.inputArea}>
        <textarea
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Write a message..."
          className={styles.input}
          rows={1}
        />
        <ActionIcon
          color="gray"
          variant="light"
          radius="xl"
          onClick={handleSendMessage}
          disabled={!messageInput.trim()}
          className={styles.sendButton}
        >
          <IconSend size={16} />
        </ActionIcon>
      </div>
    </div>
  );
}

export default ChatWindow;
