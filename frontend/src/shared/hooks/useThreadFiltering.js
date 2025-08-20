// src/shared/hooks/useThreadFiltering.js
import { useMemo } from 'react';

/**
 * Custom hook for filtering chat threads based on event context
 * 
 * Handles the complex logic for determining which threads to show based on:
 * - Current event context (event vs general view)
 * - Thread scope (event-scoped vs global threads)
 * - User membership in events
 * 
 * @param {Array} threadsArray - Array of thread objects
 * @param {number|null} currentEventId - Current event ID, null for general view
 * @param {Set} eventUserIds - Set of user IDs who are members of the current event
 * @param {boolean} enableDebugLogs - Whether to log filtering decisions (default: false)
 * 
 * @returns {Array} Filtered array of threads appropriate for the current context
 */
export function useThreadFiltering(threadsArray, currentEventId, eventUserIds, enableDebugLogs = false) {
  return useMemo(() => {
    if (enableDebugLogs) {
      console.log('Filtering threads - currentEventId:', currentEventId);
      console.log('All threads:', threadsArray);
      console.log('Event user IDs:', Array.from(eventUserIds));
    }

    if (!currentEventId) {
      // General context: Show only global threads (event_scope_id is null/undefined)
      // Exclude event-scoped threads from general view
      const filtered = threadsArray.filter((thread) => {
        const isGlobalThread = !thread.event_scope_id;
        
        if (enableDebugLogs) {
          console.log('General - Thread:', thread.id, 'event_scope_id:', thread.event_scope_id, 'isGlobal:', isGlobalThread);
        }
        
        return isGlobalThread;
      });
      
      return filtered;
    }

    // Event context: Show threads with users who are in the current event
    // This includes both global threads (for connected users) and event-scoped threads
    const filtered = threadsArray.filter((thread) => {
      const otherUserId = thread.other_user?.id;
      const isEventScopedThread = thread.event_scope_id === currentEventId;
      const userInEvent = otherUserId && eventUserIds.has(otherUserId);
      
      // Show thread if:
      // 1. It's scoped to this specific event, OR
      // 2. It's a global thread with a user who's in this event
      const shouldShow = isEventScopedThread || (!thread.event_scope_id && userInEvent);
      
      if (enableDebugLogs) {
        console.log('Event - Thread:', thread.id, 'event_scope_id:', thread.event_scope_id, 'other user:', otherUserId, 'in event:', userInEvent, 'show:', shouldShow);
      }
      
      return shouldShow;
    });

    return filtered;
  }, [threadsArray, currentEventId, eventUserIds, enableDebugLogs]);
}