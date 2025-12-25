import { useState, useEffect, memo, useRef, type ReactNode } from 'react';
import { Text, Stack, Center } from '@mantine/core';
import { LoadingSpinner } from '@/shared/components/loading';
import { IconHash, IconLock, IconGlobe, IconMicrophone } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { useGetChatRoomsQuery, useSendMessageMutation } from '@/app/features/chat/api';
import { useGetEventQuery } from '@/app/features/events/api';
import {
  joinEventNotifications,
  leaveEventNotifications,
  setActiveChatRoom,
} from '@/app/features/networking/socketClient';
import { ChatRoom as ChatRoomComponent } from './ChatRoom';
import styles from './styles/index.module.css';
import type { ChatRoom } from '@/types/chat';
import type { ChatRoomType } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ChatAreaProps {
  eventId: string | number;
}

interface InputValues {
  [roomId: number]: string;
}

interface RoomTypeLabel {
  label: string;
  className: string;
}

// Use ChatMessageCallbackEvent from socketTypes

/**
 * Chat rooms API response wrapper
 * Note: The RTK Query type says ChatRoom[] but the actual API returns { chat_rooms: ChatRoom[] }
 */
interface ChatRoomsApiResponse {
  chat_rooms: ChatRoom[];
}

/** Event data response with user role info */
interface EventDataResponse {
  id: number;
  user_role?: 'ADMIN' | 'ORGANIZER' | 'MODERATOR' | 'SPEAKER' | 'ATTENDEE';
  is_banned?: boolean;
  is_chat_banned?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

function ChatAreaComponent({ eventId: eventIdProp }: ChatAreaProps): ReactNode {
  // Normalize eventId to number for consistent comparisons (memo, deps, etc.)
  const eventId = eventIdProp ? parseInt(String(eventIdProp), 10) : null;

  // Debug: Track renders (remove in production)
  console.log(`🎨 ChatArea render - eventId: ${eventId} (type: ${typeof eventIdProp})`);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeRoom, setActiveRoom] = useState<number | null>(null);
  const [inputValues, setInputValues] = useState<InputValues>({});
  const activeRoomRef = useRef<number | null>(null); // Track active room for cleanup

  const {
    data: chatRooms,
    isLoading,
    error,
  } = useGetChatRoomsQuery(eventId as number, {
    skip: !eventId,
  });
  const { data: eventData } = useGetEventQuery(
    { id: eventId as number },
    {
      skip: !eventId,
    },
  );
  const [sendMessage] = useSendMessageMutation();

  // Track mount/unmount and cleanup on unmount
  useEffect(() => {
    console.log(`🚀 ChatArea MOUNTED - eventId: ${eventId}`);

    // Cleanup function runs when component fully unmounts (tab switch, navigation, etc)
    return () => {
      console.log(`🔥 ChatArea UNMOUNTING - eventId: ${eventId}`);

      // IMPORTANT: Only use ref here, not state (closure issue with empty deps)
      const currentRoom = activeRoomRef.current;
      console.log(`🔍 ChatArea unmount - activeRoomRef.current: ${currentRoom}`);

      if (currentRoom) {
        console.log(`🚪 ChatArea unmounting: Leaving room ${currentRoom}`);
        // NOTE: ChatRoom components handle their own callback cleanup on unmount
        // We just need to clean up socket room membership
        setActiveChatRoom(null)
          .then(() => {
            console.log(`✅ ChatArea unmount: Successfully left room ${currentRoom}`);
            activeRoomRef.current = null; // Clear ref after successful leave
          })
          .catch((cleanupError: unknown) => {
            console.error(`❌ ChatArea unmount: Error leaving room ${currentRoom}:`, cleanupError);
            activeRoomRef.current = null; // Clear ref even on error
          });
      } else {
        console.log(`⚠️ ChatArea unmounting: No active room to leave (ref was null)`);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = only on true mount/unmount, uses ref to avoid closure issues

  // Extract chat rooms from paginated response and sort them
  // Note: API returns { chat_rooms: ChatRoom[] } but RTK Query type is ChatRoom[]
  const rawRooms: ChatRoom[] = (chatRooms as unknown as ChatRoomsApiResponse)?.chat_rooms || [];

  // Sort rooms: GLOBAL (general) first, then GREEN_ROOM (speakers), then ADMIN
  const rooms = [...rawRooms].sort((a, b) => {
    // Define the order of room types
    const typeOrder: Record<string, number> = { GLOBAL: 1, GREEN_ROOM: 2, ADMIN: 3 };

    // First sort by room type
    const typeCompare = (typeOrder[a.room_type] || 999) - (typeOrder[b.room_type] || 999);
    if (typeCompare !== 0) return typeCompare;

    // Then sort by display_order within the same type
    return a.display_order - b.display_order;
  });

  console.log('ChatArea API response:', { eventId, chatRooms, rooms, isLoading, error });

  // Cast eventData to our expected type
  const typedEventData = eventData as EventDataResponse | undefined;

  // Determine if current user can moderate messages
  const canModerate =
    typedEventData?.user_role === 'ADMIN' || typedEventData?.user_role === 'ORGANIZER';

  // Check if current user can send chat messages (not banned or chat-banned)
  const canSendMessages = Boolean(
    typedEventData && !typedEventData.is_banned && !typedEventData.is_chat_banned,
  );

  // ==========================================
  // CENTRALIZED SOCKET ROOM MANAGEMENT
  // Parent manages all socket room joins/leaves to ensure single room presence
  // ==========================================
  useEffect(() => {
    if (!activeRoom) {
      console.log('🚫 Parent: No active room, skipping socket setup');
      return;
    }

    let isMounted = true;
    const previousRoom = activeRoomRef.current;

    console.log(`📝 Parent: Updating ref from ${previousRoom} to ${activeRoom}`);
    activeRoomRef.current = activeRoom;

    const setupRoom = async (): Promise<void> => {
      console.log(`🎯 Parent: Setting up room ${activeRoom} (previous: ${previousRoom})`);

      try {
        // Join the new room via socket (this will leave previous room automatically)
        await setActiveChatRoom(activeRoom);

        if (!isMounted) {
          console.log(`⚠️ Parent: Component unmounted during setup of room ${activeRoom}`);
          return;
        }

        // NOTE: Don't register a callback here - ChatRoom component handles message updates
        // Registering here would overwrite the child's callback since the Map only stores one per room
        console.log(`✅ Parent: Room ${activeRoom} setup complete`);
      } catch (setupError) {
        console.error(`❌ Parent: Failed to set up room ${activeRoom}:`, setupError);
      }
    };

    setupRoom();

    // Cleanup function
    // NOTE: Don't unregister callbacks here - ChatRoom manages its own callback lifecycle
    // The socket room leave is handled by the next room join (auto-leaves previous)
    return () => {
      isMounted = false;
      console.log(`🧹 Parent: Room change cleanup for room ${activeRoom}`);
    };
  }, [activeRoom]); // Only depends on activeRoom changing

  // Track URL room param with stable value
  const urlRoomParam = searchParams.get('room');
  const urlRoomId = urlRoomParam ? parseInt(urlRoomParam, 10) : null;

  // Single source of truth: derive active room from URL param
  // This prevents race conditions from multiple competing effects
  useEffect(() => {
    if (rooms.length === 0) return;

    let targetRoomId: number;

    const firstRoom = rooms[0];
    if (!firstRoom) return; // Safety check (shouldn't happen given length check above)

    if (urlRoomId) {
      const roomExists = rooms.some((r) => r.id === urlRoomId);
      if (roomExists) {
        targetRoomId = urlRoomId;
      } else {
        // Invalid room in URL, redirect to first room
        targetRoomId = firstRoom.id;
        const newParams = new URLSearchParams(searchParams);
        newParams.set('room', targetRoomId.toString());
        setSearchParams(newParams, { replace: true });
        return; // Effect will re-run with correct URL
      }
    } else {
      // No room param, set to first room
      targetRoomId = firstRoom.id;
      const newParams = new URLSearchParams(searchParams);
      newParams.set('room', targetRoomId.toString());
      setSearchParams(newParams, { replace: true });
      return; // Effect will re-run with correct URL
    }

    // URL is valid, sync activeRoom state ONLY if different
    if (activeRoom !== targetRoomId) {
      console.log('📍 URL sync: Setting active room to:', targetRoomId);
      setActiveRoom(targetRoomId);
    }
    // Dependencies: Only re-run when rooms array or URL room ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, urlRoomId]);

  // Update URL when user clicks room tab
  // Don't set state here - let URL sync effect handle it
  const handleRoomChange = (roomId: number): void => {
    console.log('👆 User clicked room:', roomId);

    // Only update URL, don't set state
    // The URL sync effect above will handle setting activeRoom
    const newParams = new URLSearchParams(searchParams);
    newParams.set('room', roomId.toString());
    setSearchParams(newParams, { replace: true });
  };

  // Join event notifications for chat updates
  useEffect(() => {
    if (eventId) {
      console.log('Joining event notifications for eventId:', eventId);
      joinEventNotifications(eventId);

      return () => {
        console.log('Leaving event notifications for eventId:', eventId);
        leaveEventNotifications(eventId);
      };
    }
  }, [eventId]);

  const handleSendMessage = async (roomId: number): Promise<void> => {
    const content = inputValues[roomId]?.trim();
    if (!content) return;

    console.log('📤 Sending message to room:', roomId, 'Content:', content);

    try {
      // Use REST API to send (backend will emit Socket.IO event)
      const result = await sendMessage({
        chatRoomId: roomId,
        content,
      }).unwrap();

      console.log('📤 Message sent successfully:', result);
      setInputValues((prev) => ({ ...prev, [roomId]: '' }));
    } catch (sendError) {
      console.error('📤 Failed to send message:', sendError);
    }
  };

  // Handle input change from ChatRoom component (receives value string)
  const handleInputChange =
    (roomId: number) =>
    (value: string): void => {
      setInputValues((prev) => ({
        ...prev,
        [roomId]: value,
      }));
    };

  if (isLoading) {
    return (
      <Center className={styles.loader ?? ''}>
        <LoadingSpinner size='lg' />
      </Center>
    );
  }

  if (!rooms.length) {
    return (
      <Center className={styles.empty ?? ''}>
        <Text c='dimmed'>No chat rooms available for this event</Text>
      </Center>
    );
  }

  // Get icon for room type
  const getRoomIcon = (roomType: ChatRoomType): ReactNode => {
    switch (roomType) {
      case 'GLOBAL':
        return <IconGlobe size={16} />;
      case 'ADMIN':
        return <IconLock size={16} />;
      case 'GREEN_ROOM':
        return <IconMicrophone size={16} />;
      default:
        return <IconHash size={16} />;
    }
  };

  // Get room type label and styling
  const getRoomTypeLabel = (room: ChatRoom): RoomTypeLabel | null => {
    switch (room.room_type) {
      case 'ADMIN':
        return { label: 'Admin', className: styles.adminLabel ?? '' };
      case 'GREEN_ROOM':
        return { label: 'Speakers', className: styles.speakerLabel ?? '' };
      default:
        return null;
    }
  };

  // Check if user can access room
  const canAccessRoom = (): boolean => {
    // For now, allow all rooms that are returned from the API
    // The backend already filters based on permissions
    return true;
  };

  return (
    <div className={styles.container}>
      <div className={styles.customTabs}>
        {/* Custom room tabs */}
        <div className={styles.roomTabsList}>
          {rooms.map((room) => {
            const typeLabel = getRoomTypeLabel(room);
            const isActive = activeRoom === room.id;

            return (
              <button
                key={room.id}
                className={`${styles.roomTab} ${isActive ? styles.roomTabActive : ''}`}
                onClick={() => handleRoomChange(room.id)}
                disabled={!canAccessRoom()}
              >
                {getRoomIcon(room.room_type)}
                <span>{room.name}</span>
                {room.room_type !== 'GLOBAL' && typeLabel && (
                  <span className={`${styles.roomTypeLabel} ${typeLabel.className}`}>
                    {typeLabel.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chat content area */}
        <div className={styles.chatContent}>
          {rooms.map((room) => {
            if (activeRoom !== room.id) return null;

            return (
              <div key={room.id} className={styles.chatPanel}>
                {canAccessRoom() ?
                  <ChatRoomComponent
                    room={room}
                    inputValue={inputValues[room.id] || ''}
                    onInputChange={handleInputChange(room.id)}
                    onSendMessage={() => handleSendMessage(room.id)}
                    canModerate={canModerate}
                    canSendMessages={canSendMessages}
                    isActive={activeRoom === room.id}
                    // New prop to indicate parent manages socket
                    socketManagedByParent={true}
                  />
                : <Center className={styles.restricted ?? ''}>
                    <Stack align='center' gap='sm'>
                      <IconLock size={48} />
                      <Text>This chat room is restricted to administrators</Text>
                    </Stack>
                  </Center>
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-mounts when parent re-renders
// Custom comparison to handle eventId as string or number
export const ChatArea = memo(ChatAreaComponent, (prevProps, nextProps) => {
  // Only re-render if eventId actually changes (handle string vs number)
  const prevId = prevProps.eventId ? parseInt(String(prevProps.eventId), 10) : null;
  const nextId = nextProps.eventId ? parseInt(String(nextProps.eventId), 10) : null;
  return prevId === nextId; // true = don't re-render, false = re-render
});
