// src/shared/components/chat/ChatWindow/index.tsx
import { useState, useEffect, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { useDispatch } from 'react-redux';
import { ActionIcon, Avatar, Text, Group } from '@mantine/core';
import { IconX, IconMinimize, IconMaximize, IconSend } from '@tabler/icons-react';
import { closeThread, minimizeThread, maximizeThread } from '../../../../app/store/chatSlice';
import { LoadingSpinner } from '../../loading';
import { useSocketMessages } from '../../../hooks/useSocketMessages';
import { useChatScroll } from '../../../hooks/useChatScroll';
import { useDMTyping } from '../../../hooks/useDMTyping';
import ChatMessage from '../ChatMessage';
import TypingIndicator from '../TypingIndicator';
import { selectUser } from '@/app/store/authSlice';
import { useAppSelector } from '@/types/hooks';
import styles from './styles/index.module.css';

/** DM message from useSocketMessages hook */
interface DirectMessage {
  id: string | number;
  thread_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  is_sender: boolean;
  status: string;
  pending?: boolean;
}

interface ChatWindowProps {
  threadId: number;
}

function ChatWindow({ threadId }: ChatWindowProps) {
  const dispatch = useDispatch();
  const [isMaximized, setIsMaximized] = useState(false);
  const currentUser = useAppSelector(selectUser);
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
  const { isOtherUserTyping, setTyping } = useDMTyping(threadId, currentUser?.id ?? 0);

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
  const handleClose = (): void => {
    dispatch(closeThread(threadId));
  };

  const handleMinimize = (): void => {
    dispatch(minimizeThread(threadId));
  };

  const handleMaximize = (): void => {
    setIsMaximized(!isMaximized);
    dispatch(maximizeThread(threadId));
  };

  // Handle send message
  const handleSendMessage = (): void => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setTyping(false);
  };

  // Handle enter key
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setMessageInput(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleMaximizeClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    handleMaximize();
  };

  const handleCloseClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    handleClose();
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className={`${styles.chatWindow ?? ''} ${isMaximized ? (styles.maximized ?? '') : ''}`}>
        <div className={styles.header}>
          <Text size='sm'>Loading chat...</Text>
          <Group gap='xs'>
            <ActionIcon size='xs' className={styles.headerAction ?? ''} onClick={handleClose}>
              <IconX size={14} />
            </ActionIcon>
          </Group>
        </div>
        <div className={styles.loading}>
          <LoadingSpinner size='sm' />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.chatWindow ?? ''} ${isMaximized ? (styles.maximized ?? '') : ''}`}>
      {/* Header */}
      <div className={styles.header} onClick={handleMinimize}>
        <Group gap='sm'>
          <Avatar src={otherUser?.image_url ?? null} radius='xl' size='sm' />
          <Text size='sm' fw={500}>
            {otherUser?.full_name || 'Chat'}
          </Text>
        </Group>
        <Group gap='xs'>
          <ActionIcon
            size='xs'
            variant='subtle'
            className={styles.headerAction ?? ''}
            onClick={handleMaximizeClick}
          >
            {isMaximized ?
              <IconMinimize size={14} />
            : <IconMaximize size={14} />}
          </ActionIcon>
          <ActionIcon
            size='xs'
            variant='subtle'
            className={styles.headerAction ?? ''}
            onClick={handleCloseClick}
          >
            <IconX size={14} />
          </ActionIcon>
        </Group>
      </div>

      {/* Messages */}
      <div
        className={styles.messages}
        ref={messagesContainerRef as React.RefObject<HTMLDivElement>}
      >
        {/* Loading indicator for pagination */}
        {isFetching && hasMore && (
          <div className={styles.loadingMore}>
            <LoadingSpinner size='xs' />
          </div>
        )}

        {(messages as DirectMessage[]).map((message) => (
          <ChatMessage
            key={message.id}
            message={{
              id:
                typeof message.id === 'number' ? message.id : parseInt(String(message.id), 10) || 0,
              content: message.content,
              created_at: message.created_at,
              ...(message.pending !== undefined && { pending: message.pending }),
            }}
            isCurrentUser={message.sender_id === currentUser?.id}
          />
        ))}
        {isOtherUserTyping && <TypingIndicator />}
        <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <textarea
          value={messageInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder='Write a message...'
          className={styles.input}
          rows={1}
        />
        <ActionIcon
          color='gray'
          variant='light'
          radius='xl'
          onClick={handleSendMessage}
          disabled={!messageInput.trim()}
          className={styles.sendButton ?? ''}
        >
          <IconSend size={16} />
        </ActionIcon>
      </div>
    </div>
  );
}

export default ChatWindow;
