import { Text, ActionIcon, Menu, Switch } from '@mantine/core';
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconMessages,
  IconMessageCircle,
} from '@tabler/icons-react';
import { cn } from '@/lib/cn';
import type { ChatRoom } from '@/types';
import styles from './styles.module.css';

type MobileCardProps = {
  room: ChatRoom & { message_count?: number };
  color: string;
  onEdit: (room: ChatRoom) => void;
  onViewChat: () => void;
  onToggle: (checked: boolean) => void;
  onDelete: () => void;
};

const MobileCard = ({ room, color, onEdit, onViewChat, onToggle, onDelete }: MobileCardProps) => {
  const iconColor =
    color === 'blue' ? '#3B82F6'
    : color === 'violet' ? '#8B5CF6'
    : '#14B8A6';

  const getBorderColor = () => {
    if (!room.is_enabled) {
      return 'rgba(239, 68, 68, 0.5)';
    }
    return (
      color === 'blue' ? 'rgba(59, 130, 246, 0.5)'
      : color === 'violet' ? 'rgba(139, 92, 246, 0.5)'
      : 'rgba(20, 184, 166, 0.5)'
    );
  };

  return (
    <div className={styles.mobileCardInner} style={{ borderLeft: `3px solid ${getBorderColor()}` }}>
      <div className={styles.mobileCardContent}>
        <div className={styles.mobileCardIcon}>
          <IconMessageCircle size={28} color={iconColor} />
        </div>

        <div className={styles.mobileCardInfo}>
          <Text fw={600} size='md' className={cn(styles.mobileCardTitle)}>
            {room.name}
          </Text>

          <Text size='xs' c='dimmed' className={cn(styles.mobileCardStats)}>
            {room.message_count ?? 0} messages
          </Text>
        </div>
      </div>

      <Menu position='bottom-end' withinPortal>
        <Menu.Target>
          <ActionIcon variant='subtle' className={cn(styles.mobileCardMenu)}>
            <IconDots size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown className={cn(styles.menuDropdown)}>
          <Menu.Item
            className={cn(styles.menuItem)}
            leftSection={<IconMessages size={14} />}
            onClick={onViewChat}
          >
            View Chat
          </Menu.Item>
          <Menu.Item
            className={cn(styles.menuItem)}
            leftSection={<IconEdit size={14} />}
            onClick={() => onEdit(room)}
          >
            Edit
          </Menu.Item>
          <Menu.Item
            className={cn(styles.menuItem)}
            leftSection={<Switch size='xs' checked={room.is_enabled} color={color} readOnly />}
            onClick={() => onToggle(!room.is_enabled)}
          >
            {room.is_enabled ? 'Enabled' : 'Disabled'}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            className={cn(styles.menuItem)}
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
