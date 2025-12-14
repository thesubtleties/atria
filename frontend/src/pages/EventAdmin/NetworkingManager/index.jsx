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
import ChatRoomsList from './ChatRoomsList';
import ChatRoomModal from './ChatRoomModal';
import styles from './styles/index.module.css';

const NetworkingManager = () => {
  const { eventId } = useParams();
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    room: null,
  });
  const [disableAllPublic, { isLoading: isDisablingAll }] = useDisableAllPublicRoomsMutation();

  const { data: response, isLoading, error } = useGetEventAdminChatRoomsQuery(eventId);

  const chatRooms = response?.chat_rooms || [];

  // Join event admin monitoring room for real-time presence updates
  // Poll for socket availability since socket might not exist yet on hard refresh
  useEffect(() => {
    console.log('🔍 NetworkingManager useEffect triggered');
    console.log('  - eventId:', eventId);

    if (!eventId) {
      console.log('  ❌ No eventId, returning');
      return;
    }

    let joined = false;
    let pollInterval = null;
    let cleanedUp = false;

    const attemptJoin = () => {
      if (joined || cleanedUp) return;

      const socket = getSocket();
      console.log(
        '  🔄 Attempting to join - socket:',
        socket?.connected ? 'connected'
        : socket ? 'exists but not connected'
        : 'null',
      );

      if (!socket) {
        console.log('  ⏳ Socket not initialized yet, will retry...');
        return;
      }

      if (socket.connected) {
        console.log('  ✅ Socket connected! Joining event admin');
        joinEventAdmin(parseInt(eventId));
        joined = true;
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        return;
      }

      // Socket exists but not connected, listen for connection
      console.log('  ⏳ Socket exists but not connected, listening for connection_success');
      const handleConnectionSuccess = () => {
        if (joined || cleanedUp) return;
        console.log('  ✨ connection_success received! Calling joinEventAdmin');
        joinEventAdmin(parseInt(eventId));
        joined = true;
        socket.off('connection_success', handleConnectionSuccess);
      };

      socket.once('connection_success', handleConnectionSuccess);
    };

    // Try immediately
    attemptJoin();

    // If not joined, poll every 500ms for up to 5 seconds
    if (!joined) {
      console.log('  🔁 Starting poll interval');
      let attempts = 0;
      pollInterval = setInterval(() => {
        attempts++;
        if (attempts > 10) {
          console.log('  ⏱️ Giving up after 10 attempts');
          clearInterval(pollInterval);
          return;
        }
        attemptJoin();
      }, 500);
    }

    return () => {
      console.log('  🧹 Cleanup');
      cleanedUp = true;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [eventId]);

  const handleDisableAllPublic = () => {
    openConfirmationModal({
      title: 'Disable All Public Chat Rooms',
      message:
        'Are you sure you want to disable all public chat rooms? This will prevent attendees from chatting until rooms are re-enabled.',
      confirmLabel: 'Disable All',
      cancelLabel: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const result = await disableAllPublic(eventId).unwrap();
          notifications.show({
            title: 'Success',
            message: `Disabled ${result.disabled_count} public chat rooms`,
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
            <Group className={styles.buttonGroup}>
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
          {error && (
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
          eventId={eventId}
        />
      </div>
    </div>
  );
};

export default NetworkingManager;
