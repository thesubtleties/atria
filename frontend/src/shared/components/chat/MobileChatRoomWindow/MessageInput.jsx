import { Textarea, ActionIcon, Group, Text } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useMobileInputHandler } from '@/shared/hooks/useMobileInputHandler';
import styles from './styles/index.module.css';

/**
 * MessageInput component for sending messages in chat rooms
 */
function MessageInput({ 
  value, 
  onChange, 
  onSend, 
  canSendMessages, 
  placeholder = "Type a message..." 
}) {
  const { 
    handleKeyDown, 
    handleSendClick, 
    handleFocus, 
    handleBlur 
  } = useMobileInputHandler(onSend, value, canSendMessages);

  if (!canSendMessages) {
    return (
      <div className={styles.inputArea}>
        <div className={styles.restrictedInput}>
          <Text size="sm" c="dimmed" ta="center">
            You cannot send messages in this chat
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.inputArea}>
      <Group gap="xs" className={styles.inputGroup}>
        <Textarea
          className={styles.messageInput}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autosize
          minRows={1}
          maxRows={3}
          radius="md"
        />
        <ActionIcon 
          size="lg"
          variant="filled"
          color="violet"
          onClick={handleSendClick}
          disabled={!value.trim()}
          className={styles.sendButton}
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>
    </div>
  );
}

export default MessageInput;