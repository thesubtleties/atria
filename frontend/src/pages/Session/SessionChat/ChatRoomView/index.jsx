import { Center, Text } from '@mantine/core';
import { ChatRoom } from '@/pages/Networking/ChatArea/ChatRoom';
import styles from './styles/index.module.css';

export function ChatRoomView({ 
  room, 
  sessionData, 
  inputValue, 
  onInputChange, 
  onSendMessage 
}) {
  if (!room) {
    return (
      <Center className={styles.emptyState} py="xl">
        <Text size="sm" c="dimmed">Chat room not available</Text>
      </Center>
    );
  }

  return (
    <div className={styles.container}>
      <ChatRoom
        room={room}
        eventId={sessionData?.event_id}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}