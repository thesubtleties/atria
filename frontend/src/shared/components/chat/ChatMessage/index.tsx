// src/shared/components/chat/ChatMessage/index.tsx
import { memo } from 'react';
import styles from './styles/index.module.css';

interface Message {
  id: number;
  content: string;
  created_at: string;
  pending?: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
}

function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  const messageClass = isCurrentUser ? styles.sent : styles.received;
  const pendingClass = message.pending ? styles.pending : '';

  return (
    <div
      className={`${styles.message} ${messageClass} ${pendingClass}`}
      data-message-id={message.id}
    >
      <div className={styles.messageContent}>{message.content}</div>
      <div className={styles.messageTime}>
        {new Date(message.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
        {message.status === 'read' && isCurrentUser && <span className={styles.readStatus}>✓</span>}
      </div>
    </div>
  );
}

// Use memo to prevent unnecessary re-renders
export default memo(ChatMessage);
