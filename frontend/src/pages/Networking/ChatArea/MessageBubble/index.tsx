import { useState } from 'react';
import { Group, Text, Avatar, ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { ChatMessage } from '@/types/chat';
import styles from '../styles/index.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
  canModerate: boolean;
  onDelete: (message: ChatMessage) => void;
}

export function MessageBubble({ message, canModerate, onDelete }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState<boolean>(false);

  // Extract message data (backend always returns snake_case)
  const { user, content, created_at, is_deleted, deleted_at, deleted_by } = message;

  const time =
    created_at ?
      new Date(created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Extract user name
  const fullName = user?.full_name || 'Anonymous';
  const initial = fullName?.[0] || '?';

  // Format deletion time
  const deletionTime =
    deleted_at ?
      new Date(deleted_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <Group
      gap='sm'
      align='flex-start'
      className={styles.message ?? ''}
      data-message-id={message.id}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        backgroundColor: is_deleted ? 'rgba(220, 38, 38, 0.04)' : undefined,
        transition: 'background-color 0.1s ease',
      }}
    >
      <Avatar size='sm' radius='xl' src={user?.image_url ?? null} style={{ flexShrink: 0 }}>
        {!user?.image_url && initial}
      </Avatar>
      <div className={styles.messageContent}>
        <Group gap='xs'>
          <Text size='sm' fw={600} c='#1E293B'>
            {fullName}
          </Text>
          <Text size='xs' c='#94A3B8'>
            {time}
          </Text>
        </Group>
        <Text size='sm' className={styles.messageText ?? ''}>
          {content}
        </Text>
        {is_deleted && deleted_by && (
          <div className={styles.deletionInfo}>
            <Text size='xs' c='dimmed' fs='italic'>
              Message deleted by {deleted_by.full_name} • {deletionTime}
            </Text>
          </div>
        )}
      </div>

      {showActions && canModerate && !is_deleted && (
        <ActionIcon
          variant='subtle'
          color='red'
          size='sm'
          className={styles.deleteButton ?? ''}
          onClick={() => onDelete(message)}
          aria-label={`Delete message from ${fullName}`}
        >
          <IconTrash size={14} />
        </ActionIcon>
      )}
    </Group>
  );
}
