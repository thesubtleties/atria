// src/shared/components/chat/ChatSidebar/index.jsx
import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Tabs, ActionIcon, Text, Group } from '@mantine/core';
import {
  IconChevronUp,
  IconChevronDown,
  IconMessage,
} from '@tabler/icons-react';
import {
  toggleSidebar,
  openThread,
  setCurrentEventId,
  selectSidebarExpanded,
  selectCurrentEventId,
} from '../../../../app/store/chatSlice';
import { useGetDirectMessageThreadsQuery } from '../../../../app/features/networking/api';
import { useGetEventUsersQuery } from '../../../../app/features/events/api';
import ChatThreadList from '../ChatThreadList';
import styles from './styles/index.module.css';

function ChatSidebar() {
  const dispatch = useDispatch();
  const { eventId } = useParams();
  const sidebarExpanded = useSelector(selectSidebarExpanded);
  const currentEventId = useSelector(selectCurrentEventId);

  // Update current event ID when route changes
  useEffect(() => {
    if (eventId) {
      dispatch(setCurrentEventId(parseInt(eventId, 10)));
    } else {
      dispatch(setCurrentEventId(null));
    }
  }, [eventId, dispatch]);

  // Fetch threads
  const { data, isLoading, error } = useGetDirectMessageThreadsQuery();

  // Fetch event users when in event context
  const { data: eventUsersData } = useGetEventUsersQuery(
    { eventId: currentEventId },
    { skip: !currentEventId }
  );

  // Extract threads array from the response
  // The backend sends { threads: [...] }
  const threadsArray = data?.threads || data || [];

  // Create a set of user IDs who are in the current event
  const eventUserIds = useMemo(() => {
    if (!eventUsersData?.event_users) return new Set();
    console.log('Event users data:', eventUsersData);
    // event_users have user_id field, not id
    return new Set(eventUsersData.event_users.map(user => user.user_id));
  }, [eventUsersData]);

  // Filter threads based on context
  const filteredThreads = useMemo(() => {
    if (!eventId || !currentEventId) {
      // Show all threads when not in an event
      return threadsArray;
    }

    console.log('Filtering threads for event:', currentEventId);
    console.log('Event user IDs:', Array.from(eventUserIds));
    console.log('All threads:', threadsArray);

    // Filter to only show threads with users who are in the current event
    return threadsArray.filter((thread) => {
      const otherUserId = thread.other_user?.id;
      console.log('Checking thread:', thread.id, 'other user:', otherUserId);
      return otherUserId && eventUserIds.has(otherUserId);
    });
  }, [threadsArray, eventId, currentEventId, eventUserIds]);

  // Handle thread click
  const handleThreadClick = (threadId) => {
    dispatch(openThread(threadId));
  };

  return (
    <div
      className={`${styles.chatSidebar} ${sidebarExpanded ? styles.expanded : ''}`}
    >
      {/* Header */}
      <div className={styles.header} onClick={() => dispatch(toggleSidebar())}>
        <Group gap="xs">
          <IconMessage size={18} />
          <Text size="sm" fw={500}>
            Messaging
          </Text>
        </Group>
        <ActionIcon size="sm" variant="subtle">
          {sidebarExpanded ? (
            <IconChevronDown size={16} />
          ) : (
            <IconChevronUp size={16} />
          )}
        </ActionIcon>
      </div>

      {/* Expanded Content */}
      {sidebarExpanded && (
        <>
          {/* Search */}
          <div className={styles.search}>
            <input
              type="text"
              placeholder="Search messages"
              className={styles.searchInput}
            />
          </div>

          {/* Always show tabs, but adapt based on context */}
          <Tabs
            defaultValue={eventId ? 'event' : 'general'}
            value={currentEventId ? 'event' : 'general'}
            onChange={(value) => {
              if (value === 'general') {
                dispatch(setCurrentEventId(null));
              } else if (value === 'event' && eventId) {
                dispatch(setCurrentEventId(parseInt(eventId, 10)));
              }
            }}
          >
            <Tabs.List>
              {eventId && <Tabs.Tab value="event">Event</Tabs.Tab>}
              <Tabs.Tab value="general">General</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {/* Thread List with loading and error states */}
          {isLoading ? (
            <div className={styles.loading}>Loading conversations...</div>
          ) : error ? (
            <div className={styles.error}>Error loading conversations</div>
          ) : (
            <ChatThreadList
              threads={filteredThreads}
              onThreadClick={handleThreadClick}
            />
          )}
        </>
      )}
    </div>
  );
}

export default ChatSidebar;
