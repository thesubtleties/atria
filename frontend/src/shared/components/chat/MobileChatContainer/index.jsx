// src/shared/components/chat/MobileChatContainer/index.jsx
import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useGetDirectMessageThreadsQuery } from '../../../../app/features/networking/api';
import { useGetEventUsersQuery } from '../../../../app/features/events/api';
import { useThreadFiltering } from '@/shared/hooks/useThreadFiltering';
import { 
  selectSidebarExpanded,
  selectCurrentEventId,
  toggleSidebar,
  setCurrentEventId
} from '../../../../app/store/chatSlice';
import MobileChatSidebar from '../MobileChatSidebar';
import MobileChatWindow from '../MobileChatWindow';
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
  const sidebarExpanded = useSelector(selectSidebarExpanded);
  const currentEventId = useSelector(selectCurrentEventId);
  const [activeThreadId, setActiveThreadId] = useState(null);

  // Update current event ID when route changes
  useEffect(() => {
    if (eventId) {
      dispatch(setCurrentEventId(parseInt(eventId, 10)));
    } else {
      dispatch(setCurrentEventId(null));
    }
  }, [eventId, dispatch]);

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
    // Close sidebar when opening a chat on mobile
    if (sidebarExpanded) {
      dispatch(toggleSidebar());
    }
  };

  const handleCloseChat = () => {
    setActiveThreadId(null);
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
        onToggle={handleToggleSidebar}
        eventId={eventId}
        currentEventId={currentEventId}
        onContextChange={(context) => {
          if (context === 'general') {
            dispatch(setCurrentEventId(null));
          } else if (context === 'event' && eventId) {
            dispatch(setCurrentEventId(parseInt(eventId, 10)));
          }
        }}
      />

      {/* Full-Screen Chat Window */}
      {activeThreadId && (
        <MobileChatWindow
          threadId={activeThreadId}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
}

export default MobileChatContainer;