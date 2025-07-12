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

export const SessionChat = ({ sessionId, isEnabled = true, onToggle }) => {
  const [isOpen, setIsOpen] = useState(true);

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

  useEffect(() => {
    onToggle?.(isOpen);
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Collapsed State - Floating Chat Button */}
      {!isOpen && (
        <ActionIcon
          onClick={() => setIsOpen(true)}
          size="xl"
          radius="xl"
          className={styles.floatingChatButton}
        >
          <IconMessage size={24} />
        </ActionIcon>
      )}

      {/* Expanded State - Show full chat */}
      <Transition
        mounted={isOpen}
        transition="slide-left"
        duration={300}
        timingFunction="ease"
      >
        {(styles2) => (
          <Card className={styles.chatSidebar} style={styles2} p={0}>
            <SessionChatHeader
              sessionData={sessionData}
              onClose={() => setIsOpen(false)}
            />

            <ChatTabs
              chatRooms={chatRooms}
              sessionData={sessionData}
              isLoading={isLoading}
              error={error}
            />
          </Card>
        )}
      </Transition>
    </>
  );
};
