// src/shared/components/chat/MobileChatSidebar/index.jsx
import { ActionIcon, Text, Tabs } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconMessage, IconMessages, IconUsers } from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectActiveTab, setActiveTab } from '@/app/store/chatSlice';
import ChatThreadList from '../ChatThreadList';
import ChatRoomList from '../ChatRoomList';
import SessionChatRoomList from '../SessionChatRoomList';
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
  onContextChange,
  onRoomClick,
  activeChatRoomId,
  sessionId 
}) {
  const dispatch = useDispatch();
  const activeTab = useSelector(selectActiveTab);
  
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
          {/* Enhanced Tabs */}
          <div className={styles.tabsContainer}>
            <Tabs
              value={activeTab}
              onChange={(value) => {
                dispatch(setActiveTab(value));
                // Handle context change for DM tabs
                if (value === 'general' || value === 'event') {
                  onContextChange(value);
                }
              }}
              variant="pills"
              size="xs"
            >
              <Tabs.List>
                {/* Always show General tab */}
                <Tabs.Tab value="general" leftSection={<IconMessage size={14} />}>
                  Global
                </Tabs.Tab>
                
                {/* Show Event tab if in event context */}
                {eventId && (
                  <Tabs.Tab value="event" leftSection={<IconUsers size={14} />}>
                    Event
                  </Tabs.Tab>
                )}
                
                {/* Show Chat tab if in event context */}
                {eventId && (
                  <Tabs.Tab value="chat" leftSection={<IconMessages size={14} />}>
                    Rooms
                  </Tabs.Tab>
                )}
                
                {/* Show Session tab if in session context */}
                {sessionId && (
                  <Tabs.Tab value="session" leftSection={<IconMessage size={14} />}>
                    Session
                  </Tabs.Tab>
                )}
              </Tabs.List>
            </Tabs>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {/* General/Event DM tabs */}
            {(activeTab === 'general' || activeTab === 'event') && (
              threadsLoading ? (
                <div className={styles.loadingState}>
                  <Text size="sm" c="dimmed">Loading conversations...</Text>
                </div>
              ) : (
                <ChatThreadList 
                  threads={threads} 
                  onThreadClick={onThreadClick}
                  onDeleteChatStart={handleDeleteChatStart}
                />
              )
            )}
            
            {/* Chat rooms tab */}
            {activeTab === 'chat' && eventId && (
              <ChatRoomList
                eventId={eventId}
                onRoomClick={onRoomClick}
                activeChatRoomId={activeChatRoomId}
              />
            )}
            
            {/* Session chat rooms tab */}
            {activeTab === 'session' && sessionId && (
              <SessionChatRoomList
                sessionId={sessionId}
                onRoomClick={onRoomClick}
                activeChatRoomId={activeChatRoomId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileChatSidebar;