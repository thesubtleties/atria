// src/shared/components/chat/ChatWindow/index.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ActionIcon, Avatar, Text, Group } from '@mantine/core';
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
import { LoadingSpinner } from '../../loading';
import { useSocketMessages } from '../../../hooks/useSocketMessages';
import { useChatScroll } from '../../../hooks/useChatScroll';
import { useDMTyping } from '../../../hooks/useDMTyping';
import ChatMessage from '../ChatMessage';
import TypingIndicator from '../TypingIndicator';
import { selectUser } from '@/app/store/authSlice';
import styles from './styles/index.module.css';

function ChatWindow({ threadId }) {
  const dispatch = useDispatch();
  const [isMaximized, setIsMaximized] = useState(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOtherUserTyping]); // Refs are stable and don't need to be in deps

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
    setTyping(false);
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
          <Text size="sm">Loading chat...</Text>
          <Group gap="xs">
            <ActionIcon size="xs" className={styles.headerAction} onClick={handleClose}>
              <IconX size={14} className={styles.headerAction} />
            </ActionIcon>
          </Group>
        </div>
        <div className={styles.loading}>
          <LoadingSpinner size="sm" />
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
            className={styles.headerAction}
            onClick={(e) => {
              e.stopPropagation();
              handleMaximize();
            }}
          >
            {isMaximized ? (
              <IconMinimize size={14} className={styles.headerAction} />
            ) : (
              <IconMaximize size={14} className={styles.headerAction} />
            )}
          </ActionIcon>
          <ActionIcon
            size="xs"
            variant="subtle"
            className={styles.headerAction}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            <IconX size={14} className={styles.headerAction} />
          </ActionIcon>
        </Group>
      </div>

      {/* Messages */}
      <div className={styles.messages} ref={messagesContainerRef}>
        {/* Loading indicator for pagination */}
        {isFetching && hasMore && (
          <div className={styles.loadingMore}>
            <LoadingSpinner size="xs" />
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

      {/* Input */}
      <div className={styles.inputArea}>
        <textarea
          value={messageInput}
          onChange={(e) => {
            setMessageInput(e.target.value);
            setTyping(e.target.value.length > 0);
          }}
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
          <IconSend size={16} className={styles.sendButton} />
        </ActionIcon>
      </div>
    </div>
  );
}

export default ChatWindow;
