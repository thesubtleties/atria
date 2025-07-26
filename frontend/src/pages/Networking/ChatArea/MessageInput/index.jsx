import { TextInput, ActionIcon } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import styles from '../styles/index.module.css';

export function MessageInput({ roomName, value, onChange, onSend }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={styles.inputArea}>
      <TextInput
        placeholder={`Message #${roomName}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rightSection={
          <ActionIcon 
            onClick={onSend}
            disabled={!value?.trim()}
            size="lg"
          >
            <IconSend size={18} />
          </ActionIcon>
        }
        className={styles.input}
      />
    </div>
  );
}