// src/shared/components/chat/ChatThreadList/index.jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Avatar, Text, Group, Stack, Menu, ActionIcon } from '@mantine/core';
import { IconDots, IconTrash } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { notifications } from '@mantine/notifications';
import { openConfirmationModal } from '../../../components/modals/ConfirmationModal';
import { useClearThreadMutation } from '../../../../app/features/networking/api';
import { closeThread } from '../../../../app/store/chatSlice';
import styles from './styles/index.module.css';

function ChatThreadList({ threads, onThreadClick }) {
  const dispatch = useDispatch();
  const [clearThread] = useClearThreadMutation();

  const handleClearThread = (threadId, otherUserName, event) => {
    event.stopPropagation(); // Prevent thread click
    
    openConfirmationModal({
      title: 'Delete Chat',
      message: `Delete chat with ${otherUserName}? You can start fresh anytime.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await clearThread(threadId).unwrap();
          
          // Close any open chat windows for this thread
          dispatch(closeThread(threadId));
          
          notifications.show({
            title: 'Chat deleted',
            message: 'The conversation has been removed from your chat list',
            color: 'green',
          });
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: 'Failed to delete chat',
            color: 'red',
          });
        }
      },
    });
  };

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
                <Group gap="xs" wrap="nowrap">
                  {thread.last_message && (
                    <Text size="xs" c="dimmed">
                      {(() => {
                        const messageDate = new Date(thread.last_message.created_at);
                        const now = new Date();
                        // Ensure we never show future times due to clock sync issues
                        const safeDate = messageDate > now ? now : messageDate;
                        return formatDistanceToNow(safeDate, { addSuffix: true });
                      })()}
                    </Text>
                  )}
                  <Menu position="bottom-end" withArrow zIndex={1001}>
                    <Menu.Target>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="gray"
                        className={styles.menuButton}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDots size={14} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={(e) => handleClearThread(thread.id, thread.other_user?.full_name, e)}
                      >
                        Delete Chat
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
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
