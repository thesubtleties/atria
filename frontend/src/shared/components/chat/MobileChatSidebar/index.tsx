// src/shared/components/chat/MobileChatSidebar/index.tsx
import { ActionIcon, Text, Tabs } from '@mantine/core';
import {
  IconChevronUp,
  IconChevronDown,
  IconMessage,
  IconMessages,
  IconUsers,
} from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectActiveTab, setActiveTab, type ChatTab } from '@/app/store/chatSlice';
import type { DirectMessageThread } from '@/types/networking';
import type { ChatRoom } from '@/types/chat';
import ChatThreadList from '../ChatThreadList';
import ChatRoomList from '../ChatRoomList';
import SessionChatRoomList from '../SessionChatRoomList';
import styles from './styles/index.module.css';

/** Extended ChatRoom with optional runtime properties (matches ChatRoomList) */
interface ChatRoomWithExtras extends ChatRoom {
  message_count?: number;
  last_message?: {
    content: string;
  } | null;
  subtype?: string;
  unread_count?: number;
}

/** Props for the MobileChatSidebar component */
interface MobileChatSidebarProps {
  /** Whether the sidebar is expanded */
  expanded: boolean;
  /** List of direct message threads */
  threads?: DirectMessageThread[];
  /** Whether threads are currently loading */
  threadsLoading?: boolean;
  /** Callback when a thread is clicked */
  onThreadClick: (threadId: number) => void;
  /** Callback to toggle sidebar expansion */
  onToggle?: () => void;
  /** Current event ID for event-scoped chats */
  eventId?: number | null;
  /** Callback when context (general/event) changes */
  onContextChange: (context: 'general' | 'event') => void;
  /** Callback when a chat room is clicked */
  onRoomClick?: (room: ChatRoomWithExtras) => void;
  /** Currently active chat room ID */
  activeChatRoomId?: number | null;
  /** Current session ID for session-scoped chats */
  sessionId?: number | null;
}

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
  onContextChange,
  onRoomClick,
  activeChatRoomId,
  sessionId,
}: MobileChatSidebarProps) {
  const dispatch = useDispatch();
  const activeTab = useSelector(selectActiveTab);

  // Function to minimize sidebar for delete modal
  const handleDeleteChatStart = () => {
    if (expanded && onToggle) {
      onToggle(); // Minimize the sidebar
    }
  };
  const unreadCount = (threads || []).filter(
    (thread) => thread.unread_count && thread.unread_count > 0,
  ).length;
  console.log(
    '📱 MobileChatSidebar - threads.length:',
    threads?.length,
    'unreadCount:',
    unreadCount,
    'threads with unread:',
    threads?.map((t) => ({ id: t.id, unread: t.unread_count })),
  );

  const handleTabChange = (value: string | null) => {
    if (value) {
      dispatch(setActiveTab(value as ChatTab));
      // Handle context change for DM tabs
      if (value === 'general' || value === 'event') {
        onContextChange(value);
      }
    }
  };

  return (
    <div className={`${styles.mobileSidebar} ${expanded ? styles.expanded : styles.collapsed}`}>
      {/* Header - Always visible */}
      <div className={styles.header} onClick={onToggle}>
        <div className={styles.headerContent}>
          <IconMessage size={20} />
          <Text size='sm' fw={500}>
            Messages
          </Text>
          {unreadCount > 0 && <div className={styles.unreadBadge}>{unreadCount}</div>}
        </div>
        <ActionIcon variant='subtle' size='sm' color='gray' className={styles.toggleButton ?? ''}>
          {expanded ?
            <IconChevronDown size={16} />
          : <IconChevronUp size={16} />}
        </ActionIcon>
      </div>

      {/* Thread List - Only visible when expanded */}
      {expanded && (
        <div className={styles.threadListContainer}>
          {/* Enhanced Tabs */}
          <div className={styles.tabsContainer}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant='pills'
              classNames={{
                list: (eventId || sessionId ? styles.multipleTabsList : styles.singleTabList) ?? '',
              }}
            >
              <Tabs.List>
                {/* Always show General tab */}
                <Tabs.Tab value='general' leftSection={<IconMessage size={14} />}>
                  Global
                </Tabs.Tab>

                {/* Show Event tab if in event context */}
                {eventId && (
                  <Tabs.Tab value='event' leftSection={<IconUsers size={14} />}>
                    Event
                  </Tabs.Tab>
                )}

                {/* Show Chat tab if in event context */}
                {eventId && (
                  <Tabs.Tab value='chat' leftSection={<IconMessages size={14} />}>
                    Rooms
                  </Tabs.Tab>
                )}

                {/* Show Session tab if in session context */}
                {sessionId && (
                  <Tabs.Tab value='session' leftSection={<IconMessage size={14} />}>
                    Session
                  </Tabs.Tab>
                )}
              </Tabs.List>
            </Tabs>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {/* General/Event DM tabs */}
            {(activeTab === 'general' || activeTab === 'event') &&
              (threadsLoading ?
                <div className={styles.loadingState}>
                  <Text size='sm' c='dimmed'>
                    Loading conversations...
                  </Text>
                </div>
              : <ChatThreadList
                  threads={threads}
                  onThreadClick={onThreadClick}
                  onDeleteChatStart={handleDeleteChatStart}
                />)}

            {/* Chat rooms tab */}
            {activeTab === 'chat' && eventId && onRoomClick && (
              <ChatRoomList
                eventId={eventId}
                onRoomClick={onRoomClick}
                activeChatRoomId={activeChatRoomId ?? null}
              />
            )}

            {/* Session chat rooms tab */}
            {activeTab === 'session' && sessionId && onRoomClick && (
              <SessionChatRoomList
                sessionId={sessionId}
                onRoomClick={onRoomClick}
                activeChatRoomId={activeChatRoomId ?? null}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileChatSidebar;
