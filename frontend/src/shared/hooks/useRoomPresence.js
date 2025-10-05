// src/shared/hooks/useRoomPresence.js
import { useState, useEffect } from 'react';
import {
  registerRoomPresenceCallback,
  unregisterRoomPresenceCallback,
} from '../../app/features/networking/socketClient';

/**
 * Hook for tracking real-time presence in chat rooms
 *
 * Provides live user count for "health meter" UI that visualizes
 * room activity without showing individual user names.
 *
 * @param {number} roomId - Chat room ID to track
 * @returns {{ userCount: number }} - Current number of users in room
 */
export function useRoomPresence(roomId) {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!roomId) return;

    const handlePresenceUpdate = (update) => {
      if (update.type === 'user_count_update') {
        setUserCount(update.user_count);
      }
    };

    // Register callback
    registerRoomPresenceCallback(roomId, handlePresenceUpdate);

    // Cleanup on unmount or room change
    return () => {
      unregisterRoomPresenceCallback(roomId);
    };
  }, [roomId]);

  return { userCount };
}
