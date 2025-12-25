import { Center, Text } from '@mantine/core';
import { ChatRoom } from '@/pages/Networking/ChatArea/ChatRoom';
import type { SessionChatRoom, ChatMessage } from '@/types/chat';
import styles from './styles/index.module.css';

interface SessionData {
  event_id: number;
}

interface ChatRoomViewProps {
  room: SessionChatRoom | undefined;
  sessionData: SessionData | undefined;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => Promise<ChatMessage | null>;
  isActive: boolean;
  canModerate: boolean;
}

export function ChatRoomView({
  room,
  sessionData: _sessionData,
  inputValue,
  onInputChange,
  onSendMessage,
  isActive,
  canModerate,
}: ChatRoomViewProps) {
  if (!room) {
    return (
      <Center className={styles.emptyState ?? ''} py='xl'>
        <Text size='sm' c='dimmed'>
          Chat room not available
        </Text>
      </Center>
    );
  }

  return (
    <div className={styles.container ?? ''}>
      <ChatRoom
        room={room}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        isActive={isActive}
        canModerate={canModerate}
      />
    </div>
  );
}
