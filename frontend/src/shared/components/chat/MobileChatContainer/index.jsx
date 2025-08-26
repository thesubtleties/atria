// src/shared/components/chat/MobileChatContainer/index.jsx
import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import { useGetDirectMessageThreadsQuery } from '../../../../app/features/networking/api';
import { useGetEventUsersQuery, useGetEventQuery } from '../../../../app/features/events/api';
import { useThreadFiltering } from '@/shared/hooks/useThreadFiltering';
import { 
  selectSidebarExpanded,
  selectCurrentEventId,
  selectActiveChatRoomId,
  selectLastSessionId,
  toggleSidebar,
  setCurrentEventId,
  setActiveChatRoomId,
  setLastSessionId,
  setActiveTab
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
  const lastSessionId = useSelector(selectLastSessionId);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  
  // Detect if we're in a session
  const isSessionPage = location.pathname.includes('/sessions/');
  const sessionIdFromUrl = isSessionPage ? location.pathname.split('/sessions/')[1]?.split('/')[0] : null;
  
  // Parse sessionId to ensure it's a number (only use lastSessionId if we're still in an event)
  const currentSessionId = sessionIdFromUrl ? parseInt(sessionIdFromUrl, 10) : (eventId ? lastSessionId : null);

  // Update current event ID and session ID when route changes
  useEffect(() => {
    if (eventId) {
      dispatch(setCurrentEventId(parseInt(eventId, 10)));
    } else {
      dispatch(setCurrentEventId(null));
      // When leaving event context, clear session and default back to general tab
      dispatch(setLastSessionId(null));
      dispatch(setActiveTab('general'));
    }
    
    if (sessionIdFromUrl) {
      dispatch(setLastSessionId(parseInt(sessionIdFromUrl, 10)));
      // Auto-switch to session tab when in a session
      dispatch(setActiveTab('session'));
    } else if (!eventId) {
      // Clear session when not in a session and not in an event
      dispatch(setLastSessionId(null));
    }
  }, [eventId, sessionIdFromUrl, dispatch]);

  // Get threads for sidebar
  const { 
    data, 
    isLoading: threadsLoading 
  } = useGetDirectMessageThreadsQuery();

  // Fetch event users when in event context
  const { data: eventUsersData } = useGetEventUsersQuery(
    { eventId: currentEventId },
    { skip: !currentEventId }
  );
  
  // Fetch event data for permissions
  const { data: eventData } = useGetEventQuery(currentEventId, {
    skip: !currentEventId
  });

  // Extract threads array from the response
  const threadsArray = data?.threads || data || [];

  // Create a set of user IDs who are in the current event
  const eventUserIds = useMemo(() => {
    if (!eventUsersData?.event_users) return new Set();
    return new Set(eventUsersData.event_users.map(user => user.user_id));
  }, [eventUsersData]);

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