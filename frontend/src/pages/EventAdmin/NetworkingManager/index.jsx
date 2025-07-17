import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Title, Group, Stack, Alert } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
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
      <Group justify="space-between" mb="lg">
        <Title order={2}>Networking & Chat Management</Title>
        <Group>
          <Button
            variant="outline"
            color="red"
            onClick={handleDisableAllPublic}
            loading={isDisablingAll}
          >
            Disable All Public Rooms
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() =>
              setModalState({ open: true, mode: 'create', room: null })
            }
          >
            Add Chat Room
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert color="red" mb="lg">
          Failed to load chat rooms. Please try again.
        </Alert>
      )}

      <ChatRoomsList
        chatRooms={chatRooms}
        eventId={eventId}
        isLoading={isLoading}
        onEdit={(room) => setModalState({ open: true, mode: 'edit', room })}
      />

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
  );
};

export default NetworkingManager;