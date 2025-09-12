// src/shared/components/chat/MobileChatContainer/index.jsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import { store } from '../../../../app/store';
import { useGetDirectMessageThreadsQuery } from '../../../../app/features/networking/api';
import { useGetEventQuery } from '../../../../app/features/events/api';
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
  closeThreadMobile
} from '../../../../app/store/chatSlice';
import MobileChatSidebar from '../MobileChatSidebar';
import MobileChatWindow from '../MobileChatWindow';
import MobileChatRoomWindow from '../MobileChatRoomWindow';
import styles from './styles/index.module.css';

/**
 * Mobile-first chat container that manages:
 * 1. Thread list (collapsed/expanded) - serves as "minimized" state
 * 2. Full-screen individual chat windows
 * 3. Simple open/close chat flow (no minimize functionality)
 */
function MobileChatContainer() {
  const dispatch = useDispatch();
  const { eventId } = useParams();
  const location = useLocation();
  const sidebarExpanded = useSelector(selectSidebarExpanded);
  const currentEventId = useSelector(selectCurrentEventId);
  const activeChatRoomId = useSelector(selectActiveChatRoomId);
  const mobileActiveThreadId = useSelector(selectMobileActiveThreadId);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  
  // Detect if we're in a session
  const isSessionPage = location.pathname.includes('/sessions/');
  const sessionIdFromUrl = isSessionPage ? location.pathname.split('/sessions/')[1]?.split('/')[0] : null;
  
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
        const currentTab = store.getState().chat.activeTab;
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

  // Get threads for sidebar - pass eventId when in event context for efficient filtering
  const { 
    data, 
    isLoading: threadsLoading 
  } = useGetDirectMessageThreadsQuery(
    currentEventId ? { eventId: currentEventId } : undefined
  );

  // No longer need to fetch event users separately since backend provides shared_event_ids
  // when we pass the event_id parameter to getDirectMessageThreads
  
  // Fetch event data for permissions
  const { data: eventData } = useGetEventQuery(currentEventId, {
    skip: !currentEventId
  });

  // Extract threads array from the response
  const threadsArray = data?.threads || data || [];

  // No longer need eventUserIds since backend provides shared_event_ids
  const eventUserIds = new Set();

  // Filter threads based on context using shared hook
  const filteredThreads = useThreadFiltering(
    threadsArray, 
    currentEventId, 
    eventUserIds, 
    false // Disable debug logs for mobile version
  );

  const handleThreadClick = (threadId) => {
    setActiveThreadId(threadId);
    setActiveRoom(null);
    // Close sidebar when opening a chat on mobile
    if (sidebarExpanded) {
      dispatch(toggleSidebar());
    }
  };
  
  const handleRoomClick = (room) => {
    setActiveRoom(room);
    setActiveThreadId(null);
    dispatch(setActiveChatRoomId(room.id));
    // Close sidebar when opening a room on mobile
    if (sidebarExpanded) {
      dispatch(toggleSidebar());
    }
  };

  const handleCloseChat = () => {
    setActiveThreadId(null);
    setActiveRoom(null);
    dispatch(setActiveChatRoomId(null));
    dispatch(closeThreadMobile());
    // Show thread list when closing a chat
    if (!sidebarExpanded) {
      dispatch(toggleSidebar());
    }
  };

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
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
        eventId={eventId}
        currentEventId={currentEventId}
        activeChatRoomId={activeChatRoomId}
        sessionId={currentSessionId}
        onContextChange={(context) => {
          if (context === 'general') {
            dispatch(setCurrentEventId(null));
          } else if (context === 'event' && eventId) {
            dispatch(setCurrentEventId(parseInt(eventId, 10)));
          }
        }}
      />

      {/* Full-Screen Chat Window for DMs */}
      {activeThreadId && (
        <MobileChatWindow
          threadId={activeThreadId}
          onClose={handleCloseChat}
        />
      )}
      
      {/* Full-Screen Chat Room Window */}
      {activeRoom && (
        <MobileChatRoomWindow
          room={activeRoom}
          eventData={eventData}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
}

export default MobileChatContainer;