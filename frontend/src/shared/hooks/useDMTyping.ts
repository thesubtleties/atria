// src/shared/hooks/useDMTyping.js
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  registerDMTypingCallback,
  unregisterDMTypingCallback,
  getSocket,
} from '../../app/features/networking/socketClient';

/**
 * Hook for handling typing indicators in DM threads
 *
 * Provides:
 * - Real-time typing status from other user
 * - Immediate typing event emission with 1s heartbeat to refresh Redis TTL
 * - Auto-clear typing after 5 seconds of inactivity (matches backend Redis TTL)
 *
 * @param {number} threadId - DM thread ID
 * @param {number} currentUserId - Current user's ID (to ignore own typing events)
 * @returns {{
 *   isOtherUserTyping: boolean,
 *   setTyping: (isTyping: boolean) => void
 * }}
 */
interface TypingUpdate {
  type: string;
  user_id: number;
  is_typing: boolean;
}

export function useDMTyping(
  threadId: number,
  currentUserId: number,
): {
  isOtherUserTyping: boolean;
  setTyping: (isTyping: boolean) => void;
} {
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentRef = useRef(false);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle incoming typing events
  useEffect(() => {
    if (!threadId || !currentUserId) return;

    const handleTypingUpdate = (update: TypingUpdate) => {
      if (update.type === 'typing_status') {
        // Ignore our own typing events
        if (update.user_id === currentUserId) return;

        setIsOtherUserTyping(update.is_typing);

        // Auto-clear typing indicator after 5 seconds (matches Redis TTL)
        if (update.is_typing) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherUserTyping(false);
          }, 5000);
        } else {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
        }
      }
    };

    registerDMTypingCallback(threadId, handleTypingUpdate);

    return () => {
      unregisterDMTypingCallback(threadId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [threadId, currentUserId]);

  // Send typing status to backend with 1s heartbeat to refresh Redis TTL
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!threadId) return;

      const socket = getSocket();
      if (!socket) return;

      if (isTyping) {
        // Always reset the 5s auto-clear timeout on every keystroke
        if (clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current);
        }

        clearTimeoutRef.current = setTimeout(() => {
          // Stop heartbeat and send typing=false after 5s of no activity
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
          socket.emit('typing_in_dm', {
            thread_id: threadId,
            is_typing: false,
          });
          lastSentRef.current = false;
        }, 5000);

        // If we already have a heartbeat going, just reset the auto-clear timer
        if (lastSentRef.current) return;

        // Send initial typing=true immediately
        socket.emit('typing_in_dm', {
          thread_id: threadId,
          is_typing: true,
        });
        lastSentRef.current = true;

        // Start heartbeat to refresh Redis TTL every 1s (well before 5s TTL)
        heartbeatIntervalRef.current = setInterval(() => {
          socket.emit('typing_in_dm', {
            thread_id: threadId,
            is_typing: true,
          });
        }, 1000);
      } else {
        // Stop heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Immediately send typing=false
        socket.emit('typing_in_dm', {
          thread_id: threadId,
          is_typing: false,
        });
        lastSentRef.current = false;

        // Clear the auto-clear timeout
        if (clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current);
        }
      }
    },
    [threadId],
  );

  // Cleanup intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOtherUserTyping,
    setTyping,
  };
}
