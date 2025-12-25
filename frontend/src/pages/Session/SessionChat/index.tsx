import { useEffect } from 'react';
import { Card } from '@mantine/core';
import { useGetSessionChatRoomsQuery } from '@/app/features/chat/api';
import { useGetSessionQuery } from '@/app/features/sessions/api';
import { useGetEventQuery } from '@/app/features/events/api';
import {
  joinSessionChatRooms,
  leaveSessionChatRooms,
} from '@/app/features/networking/socketClient';
import { SessionChatHeader } from './SessionChatHeader';
import { ChatTabs } from './ChatTabs';
import type { Event as EventType, Session } from '@/types/events';
import styles from './styles/index.module.css';

interface SessionChatProps {
  sessionId: string | number | null;
  isEnabled?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export const SessionChat = ({
  sessionId,
  isEnabled = true,
  isOpen = true,
  onToggle,
}: SessionChatProps) => {
  const sessionIdNum = sessionId ? parseInt(String(sessionId)) : null;
  const { data: sessionData } = useGetSessionQuery({ id: sessionIdNum! }, { skip: !sessionIdNum });
  // Cast to EventType to access user_role property which is returned by the API
  const eventId = sessionData?.event_id;
  const { data: eventData } = useGetEventQuery({ id: eventId! }, { skip: !eventId }) as {
    data: EventType | undefined;
  };
  const {
    data: chatRooms,
    isLoading,
    error,
  } = useGetSessionChatRoomsQuery(sessionIdNum!, {
    skip: !sessionIdNum || !isEnabled,
  });

  const canModerate = eventData?.user_role === 'ADMIN' || eventData?.user_role === 'ORGANIZER';

  // Cast sessionData to the expected Session type for child components
  const typedSessionData = sessionData as Session | undefined;

  useEffect(() => {
    if (sessionIdNum && isEnabled && isOpen) {
      joinSessionChatRooms(sessionIdNum);

      return () => {
        leaveSessionChatRooms(sessionIdNum);
      };
    }
  }, [sessionIdNum, isEnabled, isOpen]);

  const containerClassName = [styles.chatContainer, !isOpen ? styles.chatClosed : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassName}>
      <Card className={styles.chatSidebar ?? ''} p={0}>
        <SessionChatHeader
          sessionData={typedSessionData ?? null}
          onClose={() => {
            onToggle?.(false);
          }}
        />

        <ChatTabs
          chatRooms={chatRooms}
          sessionData={typedSessionData}
          isLoading={isLoading}
          error={error}
          canModerate={canModerate}
        />
      </Card>
    </div>
  );
};
