// src/shared/components/chat/ChatThreadList/index.jsx
import { Avatar, Text, Group, Stack } from '@mantine/core';
import { formatDistanceToNow } from 'date-fns';
import styles from './styles/index.module.css';

function ChatThreadList({ threads, onThreadClick }) {
  if (!threads.length) {
    return (
      <div className={styles.emptyState}>
        <Text size="sm" c="dimmed">
          No conversations yet
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.threadList}>
      {threads.map((thread) => (
        <div
          key={thread.id}
          className={styles.threadItem}
          onClick={() => onThreadClick(thread.id)}
        >
          <Group gap="sm" wrap="nowrap">
            <Avatar src={thread.other_user?.image_url} radius="xl" size="sm" />
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" wrap="nowrap">
                <Text size="sm" fw={500} truncate>
                  {thread.other_user?.full_name || 'Unknown User'}
                </Text>
                {thread.last_message && (
                  <Text size="xs" c="dimmed">
                    {formatDistanceToNow(
                      new Date(thread.last_message.created_at),
                      {
                        addSuffix: true,
                      }
                    )}
                  </Text>
                )}
              </Group>
              <Text size="xs" c="dimmed" truncate>
                {thread.last_message?.content || 'Start a conversation'}
              </Text>
            </Stack>
          </Group>
        </div>
      ))}
    </div>
  );
}

export default ChatThreadList;
