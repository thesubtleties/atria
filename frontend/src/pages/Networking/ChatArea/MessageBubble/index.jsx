import { Group, Text, Avatar } from '@mantine/core';
import styles from '../styles/index.module.css';

export function MessageBubble({ message }) {
  // Handle both snake_case (from backend) and camelCase (from local state)
  const { user, sender, content, created_at, createdAt } = message;
  const messageUser = user || sender;
  const timestamp = created_at || createdAt;
  
  const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '';

  // Extract user name - handle both formats
  const fullName = messageUser?.full_name || messageUser?.fullName || 
                   `${messageUser?.first_name || messageUser?.firstName || ''} ${messageUser?.last_name || messageUser?.lastName || ''}`.trim() || 
                   'Anonymous';
  const initial = fullName?.[0] || '?';

  return (
    <Group gap="sm" align="flex-start" className={styles.message}>
      <Avatar 
        size="sm" 
        radius="xl"
        src={messageUser?.image_url || messageUser?.imageUrl}
        style={{ flexShrink: 0 }}
      >
        {!messageUser?.image_url && !messageUser?.imageUrl && initial}
      </Avatar>
      <div className={styles.messageContent}>
        <Group gap="xs">
          <Text size="sm" fw={600} c="#1E293B">
            {fullName}
          </Text>
          <Text size="xs" c="#94A3B8">
            {time}
          </Text>
        </Group>
        <Text size="sm" className={styles.messageText}>
          {content}
        </Text>
      </div>
    </Group>
  );
}