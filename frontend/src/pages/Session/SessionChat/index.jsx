import { useState, useEffect } from 'react';
import { Card, ActionIcon, Transition } from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';
import { useGetSessionChatRoomsQuery } from '@/app/features/chat/api';
import { useGetSessionQuery } from '@/app/features/sessions/api';
import {
  joinSessionChatRooms,
  leaveSessionChatRooms,
} from '@/app/features/networking/socketClient';
import { SessionChatHeader } from './SessionChatHeader';
import { ChatTabs } from './ChatTabs';
import styles from './styles/index.module.css';

export const SessionChat = ({ sessionId, isEnabled = true, isOpen = true, onToggle }) => {
  const [internalOpen, setInternalOpen] = useState(true);

  const sessionIdNum = sessionId ? parseInt(sessionId) : null;
  const { data: sessionData } = useGetSessionQuery(sessionIdNum);
  const {
    data: chatRooms,
    isLoading,
    error,
  } = useGetSessionChatRoomsQuery(sessionIdNum, {
    skip: !sessionIdNum || !isEnabled,
  });

  // Join/leave session chat rooms via socket
  useEffect(() => {
    if (sessionIdNum && isEnabled && isOpen) {
      joinSessionChatRooms(sessionIdNum);

      return () => {
        leaveSessionChatRooms(sessionIdNum);
      };
    }
  }, [sessionIdNum, isEnabled, isOpen]);

  return (
    <div className={`${styles.chatContainer} ${!isOpen ? styles.chatClosed : ''}`}>
      <Card className={styles.chatSidebar} p={0}>
        <SessionChatHeader
          sessionData={sessionData}
          onClose={() => {
            onToggle?.(false);
          }}
        />

        <ChatTabs
          chatRooms={chatRooms}
          sessionData={sessionData}
          isLoading={isLoading}
          error={error}
        />
      </Card>
    </div>
  );
};
