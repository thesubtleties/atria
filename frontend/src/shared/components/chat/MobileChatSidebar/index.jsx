// src/shared/components/chat/MobileChatSidebar/index.jsx
import { ActionIcon, Text, Tabs } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconMessage } from '@tabler/icons-react';
import ChatThreadList from '../ChatThreadList';
import styles from './styles/index.module.css';

/**
 * Mobile sidebar that can be collapsed/expanded
 * When expanded: Shows full thread list
 * When collapsed: Shows compact header only
 * Serves as the "minimized" state for mobile chat
 */
function MobileChatSidebar({ 
  expanded, 
  threads = [], 
  threadsLoading, 
  onThreadClick, 
  onToggle, 
  eventId, 
  currentEventId, 
  onContextChange 
}) {
  
  // Function to minimize sidebar for delete modal
  const handleDeleteChatStart = () => {
    if (expanded && onToggle) {
      onToggle(); // Minimize the sidebar
    }
  };
  const unreadCount = (threads || []).filter(thread => thread.unread_count > 0).length;

  return (
    <div className={`${styles.mobileSidebar} ${expanded ? styles.expanded : styles.collapsed}`}>
      {/* Header - Always visible */}
      <div className={styles.header} onClick={onToggle}>
        <div className={styles.headerContent}>
          <IconMessage size={20} />
          <Text size="sm" fw={500}>
            Messages
          </Text>
          {unreadCount > 0 && (
            <div className={styles.unreadBadge}>
              {unreadCount}
            </div>
          )}
        </div>
        <ActionIcon 
          variant="subtle" 
          size="sm" 
          color="gray"
          className={styles.toggleButton}
        >
          {expanded ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
        </ActionIcon>
      </div>

      {/* Thread List - Only visible when expanded */}
      {expanded && (
        <div className={styles.threadListContainer}>
          {/* Context Tabs - only show if in event */}
          {eventId && (
            <div className={styles.tabsContainer}>
              <Tabs
                value={currentEventId ? 'event' : 'general'}
                onChange={onContextChange}
                variant="pills"
                size="xs"
              >
                <Tabs.List>
                  <Tabs.Tab value="event">Event</Tabs.Tab>
                  <Tabs.Tab value="general">General</Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </div>
          )}

          {threadsLoading ? (
            <div className={styles.loadingState}>
              <Text size="sm" c="dimmed">Loading conversations...</Text>
            </div>
          ) : (
            <ChatThreadList 
              threads={threads} 
              onThreadClick={onThreadClick}
              onDeleteChatStart={handleDeleteChatStart}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default MobileChatSidebar;