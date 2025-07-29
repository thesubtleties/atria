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
  const currentUser = useSelector(selectUser);
  console.log('current user', currentUser);
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

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Handle scroll to load more messages
  useEffect(() => {
    const handleScroll = () => {
      const container = messagesContainerRef.current;
      if (!container) return;

      // If scrolled near the top and has more messages, load more
      if (container.scrollTop < 50 && hasMore && !isFetching) {
        // Save current scroll position
        const scrollHeight = container.scrollHeight;

        loadMoreMessages();

        // After loading, restore scroll position
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - scrollHeight;
          }
        }, 100);
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
    };
  }, [hasMore, isFetching, loadMoreMessages]);

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
