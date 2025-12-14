import { useState } from 'react';
import { Table, Switch, ActionIcon, Menu, Text, Indicator } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconMessages } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { useToggleChatRoomMutation, useDeleteChatRoomMutation } from '@/app/features/chat/api';
import { useRoomPresence } from '@/shared/hooks/useRoomPresence';
import MobileCard from './MobileCard';
import styles from './styles.module.css';

const ChatRoomRow = ({ room, color, onEdit, isTableRow, isMobile }) => {
  const navigate = useNavigate();
  const [toggleRoom] = useToggleChatRoomMutation();
  const [deleteRoom] = useDeleteChatRoomMutation();
  const [isToggling, setIsToggling] = useState(false);

  // Get live user count from presence tracking
  const { userCount } = useRoomPresence(room.id);

  const handleToggle = async (checked) => {
    setIsToggling(true);
    try {
      await toggleRoom(room.id).unwrap();
      notifications.show({
        title: 'Success',
        message: `Chat room ${checked ? 'enabled' : 'disabled'}`,
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update chat room status',
        color: 'red',
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = () => {
    openConfirmationModal({
      title: 'Delete Chat Room',
      message: `Are you sure you want to delete "${room.name}"? This will permanently delete all messages in this room.`,
      confirmLabel: 'Delete Room',
      cancelLabel: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteRoom(room.id).unwrap();
          notifications.show({
            title: 'Success',
            message: 'Chat room deleted successfully',
            color: 'green',
          });
        } catch {
          notifications.show({
            title: 'Error',
            message: 'Failed to delete chat room',
            color: 'red',
          });
        }
      },
    });
  };

  const handleViewChat = () => {
    // Navigate to the networking page with chat tab and this room selected
    navigate(`/app/events/${room.event_id}/networking?tab=chat&room=${room.id}`);
  };

  // Mobile card layout
  if (isMobile) {
    return (
      <MobileCard
        room={room}
        color={color}
        onEdit={onEdit}
        onViewChat={handleViewChat}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    );
  }

  // Desktop table row content
  const content = (
    <>
      <Table.Td>
        <Text fw={500}>{room.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text size='sm' c='dimmed' lineClamp={1}>
          {room.description || '-'}
        </Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Text size='sm'>{room.message_count || 0}</Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        {userCount > 0 ?
          <Indicator processing color='green' size={10}>
            <Text size='sm'>{userCount}</Text>
          </Indicator>
        : <Text size='sm'>{userCount}</Text>}
      </Table.Td>
      <Table.Td>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Switch
            checked={room.is_enabled}
            onChange={(event) => handleToggle(event.currentTarget.checked)}
            disabled={isToggling}
            color={color}
          />
        </div>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Menu shadow='md' width={200} position='bottom-end'>
          <Menu.Target>
            <ActionIcon variant='subtle' color='gray' className={styles.actionIcon}>
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown className={styles.menuDropdown}>
            <Menu.Item
              className={styles.menuItem}
              leftSection={<IconMessages size={14} />}
              onClick={handleViewChat}
            >
              View Chat
            </Menu.Item>
            <Menu.Item
              className={styles.menuItem}
              leftSection={<IconEdit size={14} />}
              onClick={() => onEdit(room)}
            >
              Edit
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              className={styles.menuItem}
              leftSection={<IconTrash size={14} />}
              color='red'
              onClick={handleDelete}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </>
  );

  // If isTableRow, return just the cells (parent provides the row)
  if (isTableRow) {
    return content;
  }

  // Otherwise, wrap in a table row
  return <Table.Tr>{content}</Table.Tr>;
};

export default ChatRoomRow;
