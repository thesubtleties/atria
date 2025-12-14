// src/shared/components/chat/MobileChatContainer/index.tsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import { store, type RootState, type AppDispatch } from '@/app/store';
import { useGetDirectMessageThreadsQuery } from '@/app/features/networking/api';
import { useGetEventQuery } from '@/app/features/events/api';
import { useThreadFiltering } from '@/shared/hooks/useThreadFiltering';
import {
  selectSidebarExpanded,
  selectCurrentEventId,
  selectActiveChatRoomId,
  selectMobileActiveThreadId,
  toggleSidebar,
  setCurrentEventId,
  setActiveChatRoomId,
  setActiveTab,
  closeThreadMobile,
} from '@/app/store/chatSlice';
import type { ChatRoom } from '@/types/chat';
import type { DirectMessageThread } from '@/types/networking';
import type { EventUserRole } from '@/types/enums';
import MobileChatSidebar from '../MobileChatSidebar';
import MobileChatWindow from '../MobileChatWindow';
import MobileChatRoomWindow, {
  type MobileChatRoom as MobileChatRoomType,
  type EventData,
} from '../MobileChatRoomWindow';
import styles from './styles/index.module.css';

/** Extended ChatRoom with optional runtime properties for sidebar (matches MobileChatSidebar) */
interface SidebarChatRoom extends ChatRoom {
  message_count?: number;
  last_message?: {
    content: string;
  } | null;
  subtype?: string;
  unread_count?: number;
}

/** DirectMessageThread extended with event scope properties (returned by backend API) */
interface DirectMessageThreadWithScope extends DirectMessageThread {
  event_scope_id: number | null;
  shared_event_ids?: number[];
}

/**
 * Mobile-first chat container that manages:
 * 1. Thread list (collapsed/expanded) - serves as "minimized" state
 * 2. Full-screen individual chat windows
 * 3. Simple open/close chat flow (no minimize functionality)
 */
function MobileChatContainer(): React.ReactElement {
  const dispatch = useDispatch<AppDispatch>();
  const { eventId } = useParams<{ eventId?: string }>();
  const location = useLocation();
  const sidebarExpanded = useSelector(selectSidebarExpanded);
  const currentEventId = useSelector(selectCurrentEventId);
  const activeChatRoomId = useSelector(selectActiveChatRoomId);
  const mobileActiveThreadId = useSelector(selectMobileActiveThreadId);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [activeRoom, setActiveRoom] = useState<SidebarChatRoom | null>(null);

  // Detect if we're in a session
  const isSessionPage = location.pathname.includes('/sessions/');
  const sessionIdFromUrl =
    isSessionPage ? location.pathname.split('/sessions/')[1]?.split('/')[0] : null;

  // Parse sessionId to ensure it's a number (only use sessionId from URL, not lastSessionId)
  const currentSessionId = sessionIdFromUrl ? parseInt(sessionIdFromUrl, 10) : null;

  // Respond to Redux state changes for mobile thread opening
  useEffect(() => {
    if (mobileActiveThreadId && mobileActiveThreadId !== activeThreadId) {
      setActiveThreadId(mobileActiveThreadId);
      setActiveRoom(null);
      // Switch to appropriate tab based on context
      if (currentEventId) {
        dispatch(setActiveTab('event'));
      } else {
        dispatch(setActiveTab('general'));
      }
    }
  }, [mobileActiveThreadId, activeThreadId, currentEventId, dispatch]);

  // Update current event ID and handle tab switching
  useEffect(() => {
    if (eventId) {
      dispatch(setCurrentEventId(parseInt(eventId, 10)));

      // If we're in an event but not in a session, and currently on session tab, switch to event tab
      if (!sessionIdFromUrl) {
        const currentTab = (store.getState() as RootState).chat.activeTab;
        if (currentTab === 'session') {
          dispatch(setActiveTab('event'));
        }
      }
    } else {
      dispatch(setCurrentEventId(null));
      // When leaving event context, default back to general tab
      dispatch(setActiveTab('general'));
    }

    if (sessionIdFromUrl) {
      // Auto-switch to session tab when in a session
      dispatch(setActiveTab('session'));
    }
  }, [eventId, sessionIdFromUrl, dispatch]);

  // Get threads for sidebar - ALWAYS query with undefined (single cache approach)
  // Backend now ALWAYS returns all threads with complete shared_event_ids metadata
  const { data, isLoading: threadsLoading } = useGetDirectMessageThreadsQuery(undefined); // Explicit undefined for consistent cache key!

  // Fetch event data for permissions
  const { data: eventData } = useGetEventQuery({ id: currentEventId! }, { skip: !currentEventId });

  // Extract threads array from the response - cast to DirectMessageThreadWithScope[] for type safety
  // Backend returns threads with event_scope_id and shared_event_ids properties
  const threadsArray = (data?.threads || data || []) as DirectMessageThreadWithScope[];

  // Filter threads based on context using shared hook
  // Cast is safe because DirectMessageThreadWithScope extends the Thread interface requirements
  const filteredThreads = useThreadFiltering(
    threadsArray as unknown as Array<{
      id: number;
      event_scope_id: number | null;
      shared_event_ids?: number[];
      [key: string]: unknown;
    }>,
    currentEventId,
  ) as unknown as DirectMessageThreadWithScope[];

  const handleThreadClick = (threadId: number): void => {
    setActiveThreadId(threadId);
    setActiveRoom(null);
    // Close sidebar when opening a chat on mobile
    if (sidebarExpanded) {
      dispatch(toggleSidebar());
    }
  };

  const handleRoomClick = (room: SidebarChatRoom): void => {
    setActiveRoom(room);
    setActiveThreadId(null);
    dispatch(setActiveChatRoomId(room.id));
    // Close sidebar when opening a room on mobile
    if (sidebarExpanded) {
      dispatch(toggleSidebar());
    }
  };

  const handleCloseChat = (): void => {
    setActiveThreadId(null);
    setActiveRoom(null);
    dispatch(setActiveChatRoomId(null));
    dispatch(closeThreadMobile());
    // Show thread list when closing a chat
    if (!sidebarExpanded) {
      dispatch(toggleSidebar());
    }
  };

  const handleToggleSidebar = (): void => {
    dispatch(toggleSidebar());
  };

  const handleContextChange = (context: 'general' | 'event'): void => {
    if (context === 'general') {
      dispatch(setCurrentEventId(null));
    } else if (context === 'event' && eventId) {
      dispatch(setCurrentEventId(parseInt(eventId, 10)));
    }
  };

  return (
    <div className={styles.mobileContainer}>
      {/* Thread List Sidebar */}
      <MobileChatSidebar
        expanded={sidebarExpanded}
        threads={filteredThreads}
        threadsLoading={threadsLoading}
        onThreadClick={handleThreadClick}
        onRoomClick={handleRoomClick}
        onToggle={handleToggleSidebar}
        eventId={eventId ? parseInt(eventId, 10) : null}
        activeChatRoomId={activeChatRoomId}
        sessionId={currentSessionId}
        onContextChange={handleContextChange}
      />

      {/* Full-Screen Chat Window for DMs */}
      {activeThreadId && <MobileChatWindow threadId={activeThreadId} onClose={handleCloseChat} />}

      {/* Full-Screen Chat Room Window */}
      {activeRoom && (
        <MobileChatRoomWindow
          room={activeRoom as MobileChatRoomType}
          eventData={
            eventData ?
              ({
                // user_role is optional on Event type, safely access it
                user_role:
                  ((eventData as unknown as { user_role?: EventUserRole }).user_role as
                    | EventUserRole
                    | undefined) ?? null,
                // These properties come from EventUser association, cast safely
                is_banned: (eventData as unknown as { is_banned?: boolean }).is_banned ?? false,
                is_chat_banned:
                  (eventData as unknown as { is_chat_banned?: boolean }).is_chat_banned ?? false,
              } satisfies EventData)
            : null
          }
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
}

export default MobileChatContainer;
