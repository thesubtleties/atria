import { Group, Text, ActionIcon, Badge } from '@mantine/core';
import { IconMessage, IconX } from '@tabler/icons-react';
import styles from './styles/index.module.css';

export const SessionChatHeader = ({ sessionData, onClose }) => {
  return (
    <div className={styles.header}>
      <Group gap="xs">
        <IconMessage size={18} />
        <Text size="md" fw={500}>Session Chat</Text>
        {sessionData?.status === 'live' && (
          <Badge size="xs" variant="filled" color="red">
            LIVE
          </Badge>
        )}
      </Group>
      <ActionIcon 
        onClick={onClose}
        variant="subtle"
        size="sm"
      >
        <IconX size={16} />
      </ActionIcon>
    </div>
  );
};