import { useMemo } from 'react';
import type { FilterableThread } from '@/types/networking';

/**
 * Custom hook for filtering chat threads based on event context
 *
 * Handles the complex logic for determining which threads to show based on:
 * - Current event context (event vs general view)
 * - Thread scope (event-scoped vs global threads)
 * - User membership in events (via shared_event_ids from backend)
 *
 * @param threadsArray - Array of thread objects with shared_event_ids metadata
 * @param currentEventId - Current event ID, null for general view
 * @returns Filtered array of threads appropriate for the current context
 */
export function useThreadFiltering<T extends FilterableThread>(
  threadsArray: T[] | null | undefined,
  currentEventId: number | null,
): T[] {
  return useMemo(() => {
    if (!threadsArray) return [];

    if (!currentEventId) {
      // General tab: only show global threads (no event_scope_id)
      return threadsArray.filter((thread) => !thread.event_scope_id);
    } else {
      // Event tab: show threads where users share this event
      return threadsArray.filter((thread) => {
        // Show event-scoped threads for this event
        if (thread.event_scope_id === currentEventId) return true;

        // Show global threads where the other user is in this event
        // Backend ALWAYS provides shared_event_ids array (empty array [] if no shared events)
        if (!thread.event_scope_id && thread.shared_event_ids?.includes(currentEventId)) {
          return true;
        }

        return false;
      });
    }
  }, [threadsArray, currentEventId]);
}
