import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Group, Alert } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Button } from '@/shared/components/buttons';
import { 
  useGetEventAdminChatRoomsQuery,
  useDisableAllPublicRoomsMutation 
} from '@/app/features/chat/api';
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

  const {
    data: response,
    isLoading,
    error,
  } = useGetEventAdminChatRoomsQuery(eventId);

  const chatRooms = response?.chat_rooms || [];

  const handleDisableAllPublic = async () => {
    if (confirm('Are you sure you want to disable all public chat rooms? This will prevent attendees from chatting until rooms are re-enabled.')) {
      try {
        const result = await disableAllPublic(eventId).unwrap();
        notifications.show({
          title: 'Success',
          message: `Disabled ${result.disabled_count} public chat rooms`,
          color: 'green',
        });
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to disable chat rooms',
          color: 'red',
        });
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <section className={styles.headerSection}>
          <Group justify="space-between" align="flex-start">
            <h2 className={styles.pageTitle}>Networking & Chat Management</h2>
            <Group className={styles.buttonGroup}>
              <Button
                variant="danger"
                onClick={handleDisableAllPublic}
                disabled={isDisablingAll}
              >
                Disable All Public Rooms
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  setModalState({ open: true, mode: 'create', room: null })
                }
              >
                <IconPlus size={18} />
                Add Chat Room
              </Button>
            </Group>
          </Group>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          {error && (
            <Alert color="red" mb="lg">
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
          onClose={() =>
            setModalState({ open: false, mode: 'create', room: null })
          }
          mode={modalState.mode}
          room={modalState.room}
          eventId={eventId}
        />
      </div>
    </div>
  );
};

export default NetworkingManager;