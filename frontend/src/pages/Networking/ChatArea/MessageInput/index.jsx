import { TextInput, ActionIcon, Text } from '@mantine/core';
import { IconSend, IconVolumeOff } from '@tabler/icons-react';
import styles from '../styles/index.module.css';

export function MessageInput({ roomName, value, onChange, onSend, canSendMessages = true, muteReason }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && canSendMessages) {
      e.preventDefault();
      onSend();
    }
  };

  if (!canSendMessages) {
    return (
      <div className={styles.inputArea} style={{ 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #e9ecef',
        borderRadius: '6px',
        padding: '12px',
        opacity: 0.7
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6c757d' }}>
          <IconVolumeOff size={18} />
          <Text size="sm" color="dimmed">
            {muteReason || "You are muted from chat"}
          </Text>
        </div>
      </div>
    );
  }

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