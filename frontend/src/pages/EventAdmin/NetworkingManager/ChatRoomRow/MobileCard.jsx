import { Text, ActionIcon, Menu, Switch } from '@mantine/core';
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconMessages,
  IconMessageCircle,
} from '@tabler/icons-react';
import styles from './styles.module.css';

const MobileCard = ({ room, color, onEdit, onViewChat, onToggle, onDelete }) => {
  // Determine icon color based on room type
  const iconColor =
    color === 'blue' ? '#3B82F6'
    : color === 'violet' ? '#8B5CF6'
    : '#14B8A6';

  // Determine border color based on status and type
  const getBorderColor = () => {
    if (!room.is_enabled) {
      return 'rgba(239, 68, 68, 0.5)'; // Red for inactive
    }
    // Use room type color for active
    return (
      color === 'blue' ? 'rgba(59, 130, 246, 0.5)'
      : color === 'violet' ? 'rgba(139, 92, 246, 0.5)'
      : 'rgba(20, 184, 166, 0.5)'
    );
  };

  return (
    <div className={styles.mobileCardInner} style={{ borderLeft: `3px solid ${getBorderColor()}` }}>
      <div className={styles.mobileCardContent}>
        {/* Icon */}
        <div className={styles.mobileCardIcon}>
          <IconMessageCircle size={28} color={iconColor} />
        </div>

        {/* Room Info */}
        <div className={styles.mobileCardInfo}>
          <Text fw={600} size='md' className={styles.mobileCardTitle}>
            {room.name}
          </Text>

          {/* Status and Stats */}
          <Text size='xs' c='dimmed' className={styles.mobileCardStats}>
            {room.message_count || 0} messages
          </Text>
        </div>
      </div>

      {/* Menu in corner */}
      <Menu position='bottom-end' withinPortal>
        <Menu.Target>
          <ActionIcon variant='subtle' className={styles.mobileCardMenu}>
            <IconDots size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown className={styles.menuDropdown}>
          <Menu.Item
            className={styles.menuItem}
            leftSection={<IconMessages size={14} />}
            onClick={onViewChat}
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
          <Menu.Item
            className={styles.menuItem}
            leftSection={<Switch size='xs' checked={room.is_enabled} color={color} readOnly />}
            onClick={() => onToggle(!room.is_enabled)}
          >
            {room.is_enabled ? 'Enabled' : 'Disabled'}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            className={styles.menuItem}
            leftSection={<IconTrash size={14} />}
            color='red'
            onClick={onDelete}
          >
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
};

export default MobileCard;
