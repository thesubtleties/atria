import { useState } from 'react';
import { Table, Switch, ActionIcon, Menu, Text, Indicator } from '@mantine/core';
import { IconDotsVertical, IconEdit, IconTrash, IconMessages } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { 
  useToggleChatRoomMutation, 
  useDeleteChatRoomMutation 
} from '@/app/features/chat/api';
import styles from './styles.module.css';

const ChatRoomRow = ({ room, color, onEdit }) => {
  const navigate = useNavigate();
  const [toggleRoom] = useToggleChatRoomMutation();
  const [deleteRoom] = useDeleteChatRoomMutation();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (checked) => {
    setIsToggling(true);
    try {
      await toggleRoom(room.id).unwrap();
      notifications.show({
        title: 'Success',
        message: `Chat room ${checked ? 'enabled' : 'disabled'}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update chat room status',
        color: 'red',
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${room.name}"? This will permanently delete all messages in this room.`)) {
      try {
        await deleteRoom(room.id).unwrap();
        notifications.show({
          title: 'Success',
          message: 'Chat room deleted successfully',
          color: 'green',
        });
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete chat room',
          color: 'red',
        });
      }
    }
  };

  const handleViewChat = () => {
    // Navigate to the networking page with this room selected
    navigate(`/app/events/${room.event_id}/networking?room=${room.id}`);
  };

  // Show indicator if room has recent activity
  const hasRecentActivity = room.last_activity && 
    new Date(room.last_activity) > new Date(Date.now() - 3600000); // Within last hour

  // Format room type display
  const roomTypeDisplay = room.room_type === 'GREEN_ROOM' ? 'GREEN' : room.room_type;
  
  // Get CSS class for room type
  const roomTypeClass = {
    GLOBAL: 'global',
    ADMIN: 'admin',
    GREEN_ROOM: 'greenRoom',
  }[room.room_type] || '';

  return (
    <Table.Tr>
      <Table.Td>
        <div className={`${styles.roomTypeBadge} ${styles[roomTypeClass]}`}>
          {roomTypeDisplay}
        </div>
      </Table.Td>
      <Table.Td>
        <Text fw={500}>{room.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed" lineClamp={1}>
          {room.description || '-'}
        </Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Text size="sm">{room.message_count || 0}</Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        {hasRecentActivity ? (
          <Indicator processing color="green" size={10}>
            <Text size="sm">{room.participant_count || 0}</Text>
          </Indicator>
        ) : (
          <Text size="sm">{room.participant_count || 0}</Text>
        )}
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Switch
          checked={room.is_enabled}
          onChange={(event) => handleToggle(event.currentTarget.checked)}
          disabled={isToggling}
          color={color}
        />
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Menu position="bottom-end" withArrow>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item 
              leftSection={<IconMessages size={14} />}
              onClick={handleViewChat}
            >
              View Chat
            </Menu.Item>
            <Menu.Item 
              leftSection={<IconEdit size={14} />}
              onClick={() => onEdit(room)}
            >
              Edit
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={handleDelete}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  );
};

export default ChatRoomRow;