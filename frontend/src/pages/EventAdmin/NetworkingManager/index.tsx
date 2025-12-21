import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Group, Alert } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { Button } from '@/shared/components/buttons';
import {
  useGetEventAdminChatRoomsQuery,
  useDisableAllPublicRoomsMutation,
} from '@/app/features/chat/api';
import { joinEventAdmin, getSocket } from '@/app/features/networking/socketClient';
import { cn } from '@/lib/cn';
import { isApiError } from '@/types';
import ChatRoomsList from './ChatRoomsList';
import ChatRoomModal from './ChatRoomModal';
import type { ChatRoom } from '@/types';
import styles from './styles/index.module.css';

type ModalMode = 'create' | 'edit';

type ModalState = {
  open: boolean;
  mode: ModalMode;
  room: ChatRoom | null;
};

const NetworkingManager = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    mode: 'create',
    room: null,
  });
  const [disableAllPublic, { isLoading: isDisablingAll }] = useDisableAllPublicRoomsMutation();

  const numericEventId = eventId ? parseInt(eventId, 10) : 0;
  const {
    data: response,
    isLoading,
    error,
  } = useGetEventAdminChatRoomsQuery(numericEventId, {
    skip: !eventId,
  });

  const chatRooms = (response as { chat_rooms?: ChatRoom[] })?.chat_rooms ?? [];

  // Join event admin monitoring room for real-time presence updates
  useEffect(() => {
    if (!eventId) return;

    let joined = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let cleanedUp = false;

    const attemptJoin = () => {
      if (joined || cleanedUp) return;

      const socket = getSocket();

      if (!socket) return;

      if (socket.connected) {
        joinEventAdmin(parseInt(eventId, 10));
        joined = true;
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        return;
      }

      // Socket exists but not connected, listen for connection
      const handleConnectionSuccess = () => {
        if (joined || cleanedUp) return;
        joinEventAdmin(parseInt(eventId, 10));
        joined = true;
        socket.off('connection_success', handleConnectionSuccess);
      };

      socket.once('connection_success', handleConnectionSuccess);
    };

    attemptJoin();

    // If not joined, poll every 500ms for up to 5 seconds
    if (!joined) {
      let attempts = 0;
      pollInterval = setInterval(() => {
        attempts++;
        if (attempts > 10) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }
        attemptJoin();
      }, 500);
    }

    return () => {
      cleanedUp = true;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [eventId]);

  const handleDisableAllPublic = () => {
    if (!eventId) return;

    openConfirmationModal({
      title: 'Disable All Public Chat Rooms',
      message:
        'Are you sure you want to disable all public chat rooms? This will prevent attendees from chatting until rooms are re-enabled.',
      confirmLabel: 'Disable All',
      cancelLabel: 'Cancel',
      isDangerous: true,
      children: null,
      onConfirm: async () => {
        try {
          await disableAllPublic(numericEventId).unwrap();
          notifications.show({
            title: 'Success',
            message: 'Disabled public chat rooms',
            color: 'green',
          });
        } catch {
          notifications.show({
            title: 'Error',
            message: 'Failed to disable chat rooms',
            color: 'red',
          });
        }
      },
    });
  };

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <section className={styles.headerSection}>
          <div className={styles.headerContent}>
            <h2 className={styles.pageTitle}>Networking & Chat Management</h2>
            <Group className={cn(styles.buttonGroup)}>
              <Button variant='danger' onClick={handleDisableAllPublic} disabled={isDisablingAll}>
                Disable All Public Rooms
              </Button>
              <Button
                variant='primary'
                onClick={() => setModalState({ open: true, mode: 'create', room: null })}
              >
                <IconPlus size={18} />
                Add Chat Room
              </Button>
            </Group>
          </div>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          {isApiError(error) && (
            <Alert color='red' mb='lg'>
              Failed to load chat rooms. Please try again.
            </Alert>
          )}

          <ChatRoomsList
            chatRooms={chatRooms}
            isLoading={isLoading}
            onEdit={(room) => setModalState({ open: true, mode: 'edit', room })}
          />
        </section>

        <ChatRoomModal
          opened={modalState.open}
          onClose={() => setModalState({ open: false, mode: 'create', room: null })}
          mode={modalState.mode}
          room={modalState.room}
          eventId={eventId ?? ''}
        />
      </div>
    </div>
  );
};

export default NetworkingManager;
