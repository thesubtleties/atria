// src/shared/components/chat/ChatSidebar/index.tsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Tabs, ActionIcon, Text, Group } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconMessage } from '@tabler/icons-react';
import {
  toggleSidebar,
  openThread,
  setCurrentEventId,
  selectSidebarExpanded,
  selectCurrentEventId,
} from '../../../../app/store/chatSlice';
import { useGetDirectMessageThreadsQuery } from '../../../../app/features/networking/api';
import { useThreadFiltering } from '@/shared/hooks/useThreadFiltering';
import type { DirectMessageThread } from '../../../../types/networking';
import ChatThreadList from '../ChatThreadList';
import styles from './styles/index.module.css';

/** Route params for event pages */
interface EventRouteParams {
  eventId?: string;
  [key: string]: string | undefined;
}

/** Extended thread type with filtering metadata from API */
interface ThreadWithFilterMetadata extends DirectMessageThread {
  event_scope_id: number | null;
  shared_event_ids?: number[];
  [key: string]: unknown;
}

function ChatSidebar() {
  const dispatch = useDispatch();
  const { eventId } = useParams<EventRouteParams>();
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

  // Fetch threads - ALWAYS query with undefined (single cache approach)
  const { data, isLoading, error } = useGetDirectMessageThreadsQuery(undefined);

  // Extract threads array from the response
  const threadsArray: ThreadWithFilterMetadata[] =
    (data as { threads?: ThreadWithFilterMetadata[] })?.threads ||
    (data as ThreadWithFilterMetadata[]) ||
    [];

  // Filter threads based on context using shared hook
  const filteredThreads = useThreadFiltering(threadsArray, currentEventId);

  // Handle thread click
  const handleThreadClick = (threadId: number): void => {
    dispatch(openThread(threadId));
  };

  return (
    <div className={`${styles.chatSidebar} ${sidebarExpanded ? styles.expanded : ''}`}>
      {/* Header */}
      <div className={styles.header} onClick={() => dispatch(toggleSidebar())}>
        <Group gap='xs'>
          <IconMessage size={18} />
          <Text size='sm' fw={500}>
            Messaging
          </Text>
        </Group>
        <ActionIcon size='sm' variant='subtle' color='gray' className={styles.headerToggle ?? ''}>
          {sidebarExpanded ?
            <IconChevronDown size={16} />
          : <IconChevronUp size={16} />}
        </ActionIcon>
      </div>

      {/* Expanded Content */}
      {sidebarExpanded && (
        <>
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
              {eventId && <Tabs.Tab value='event'>Event</Tabs.Tab>}
              <Tabs.Tab value='general'>General</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {isLoading ?
            <div className={styles.loading}>Loading conversations...</div>
          : error ?
            <div className={styles.error}>Error loading conversations</div>
          : <ChatThreadList threads={filteredThreads} onThreadClick={handleThreadClick} />}
        </>
      )}
    </div>
  );
}

export default ChatSidebar;
