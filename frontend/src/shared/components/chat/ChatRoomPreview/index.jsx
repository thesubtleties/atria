import { Text, Badge, Group } from '@mantine/core';
import { 
  IconHash, 
  IconLock, 
  IconGlobe, 
  IconMicrophone,
  IconUsers,
  IconMessage
} from '@tabler/icons-react';
import styles from './styles/index.module.css';

/**
 * ChatRoomPreview component displays a chat room as a thread-like preview
 * Similar to how DM threads are displayed but with room-specific styling
 */
function ChatRoomPreview({ room, isActive, onClick, messageCount = 0 }) {
  // Get icon based on room type
  const getRoomIcon = () => {
    switch (room.room_type) {
      case 'GLOBAL':
        return <IconGlobe size={20} />;
      case 'ADMIN':
        return <IconLock size={20} />;
      case 'GREEN_ROOM':
        return <IconMicrophone size={20} />;
      case 'SESSION':
        // For session rooms, check subtype
        if (room.subtype === 'BACKSTAGE') {
          return <IconUsers size={20} />;
        }
        return <IconMessage size={20} />;
      default:
        return <IconHash size={20} />;
    }
  };

  // Get room type label and color
  const getRoomTypeDisplay = () => {
    switch (room.room_type) {
      case 'ADMIN':
        return { label: 'Admin', color: 'red' };
      case 'GREEN_ROOM':
        return { label: 'Speakers', color: 'green' };
      case 'SESSION':
        if (room.subtype === 'BACKSTAGE') {
          return { label: 'Backstage', color: 'violet' };
        }
        return { label: 'Public', color: 'blue' };
      case 'GLOBAL':
        return { label: 'General', color: 'gray' };
      default:
        return null;
    }
  };

  const typeDisplay = getRoomTypeDisplay();

  // Get preview text (last message or description)
  const getPreviewText = () => {
    if (room.last_message) {
      // If we have a last message, show it
      return room.last_message.content;
    }
    if (room.description) {
      return room.description;
    }
    if (messageCount > 0) {
      return `${messageCount} messages`;
    }
    return 'No messages yet';
  };

  return (
    <div 
      className={`${styles.roomPreview} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.roomIcon}>
        {getRoomIcon()}
      </div>
      
      <div className={styles.roomContent}>
        <Group gap="xs" className={styles.roomHeader}>
          <Text size="sm" fw={500} className={styles.roomName}>
            {room.name}
          </Text>
          {typeDisplay && (
            <Badge 
              size="xs" 
              color={typeDisplay.color}
              variant="light"
            >
              {typeDisplay.label}
            </Badge>
          )}
        </Group>
        
        <Text size="xs" c="dimmed" className={styles.roomPreviewText} lineClamp={1}>
          {getPreviewText()}
        </Text>
      </div>

      {/* Unread indicator could go here if we add unread counts */}
      {room.unread_count > 0 && (
        <div className={styles.unreadBadge}>
          {room.unread_count}
        </div>
      )}
    </div>
  );
}

export default ChatRoomPreview;