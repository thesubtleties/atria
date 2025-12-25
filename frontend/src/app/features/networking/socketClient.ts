// src/app/features/networking/socketClient.ts
import type { Draft } from 'immer';
import { io, type Socket, type SocketOptions } from 'socket.io-client';
import { store } from '../../store';
import { networkingApi } from './api';
import { chatApi } from '../chat/api';
import { selectUser, selectIsAuthenticated } from '../../store/authSlice';
import type {
  DirectMessageThreadsPayload,
  DirectMessagesPayload,
  MessagesReadPayload,
  ChatRoomJoinedPayload,
  ChatRoomLeftPayload,
  ChatMessageModeratedPayload,
  ChatMessageRemovedPayload,
  ChatNotificationPayload,
  ChatRoomCreatedPayload,
  ChatRoomUpdatedPayload,
  RoomUserCountPayload,
  UserJoinedRoomPayload,
  UserLeftRoomPayload,
  ChatRoomsPayload,
  TypingInDMPayload,
  ErrorPayload,
  AuthPayload,
  ConnectionSuccessPayload,
  DirectMessageCallback,
  ChatMessageCallback,
  TypingCallback,
  RoomPresenceCallback,
} from './socketTypes';
import type { ChatMessage } from '@/types/chat';
import type { DirectMessage, DirectMessageThread } from '@/types/networking';

// ─────────────────────────────────────────────────────────────────────────────
// Module-Level Variables
// ─────────────────────────────────────────────────────────────────────────────

let socket: Socket | null = null;
let connectionPromise: Promise<Socket> | null = null;
let isConnecting = false;
const messageCallbacks = new Map<number, ChatMessageCallback>();
const directMessageCallbacks = new Map<number, DirectMessageCallback>();
const roomPresenceCallbacks = new Map<number, RoomPresenceCallback>();
const dmTypingCallbacks = new Map<number, TypingCallback>();
let activeChatRoom: number | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Socket Initialization
// ─────────────────────────────────────────────────────────────────────────────

export const initializeSocket = (token: string | null = null): Socket | null => {
  // Check environment variable to force HTTP fallback (for testing)
  // Defaults to false in production where env var won't exist
  const FORCE_HTTP_FALLBACK = import.meta.env.VITE_FORCE_HTTP_FALLBACK === 'true';

  if (FORCE_HTTP_FALLBACK) {
    console.log('⚠️ WebSocket disabled via VITE_FORCE_HTTP_FALLBACK - using HTTP fallback');
    return null;
  }

  // If socket exists and is connected, return it
  if (socket && socket.connected) {
    console.log('🔌 Socket already exists and connected, returning existing socket');
    return socket;
  }

  // If socket exists but is disconnected, reconnect it (don't create new one!)
  if (socket && !socket.connected) {
    console.log('🔌 Socket exists but disconnected, reconnecting...');
    socket.connect();
    return socket;
  }

  if (isConnecting && connectionPromise) {
    console.log('🔌 Socket connection in progress, returning promise');
    return null; // Return null since we can't return a promise here
  }

  // Make socket globally available for debugging
  window.socket = null;

  console.log('🔌 Initializing NEW socket connection with token:', token ? 'YES' : 'NO');

  // Connect using the proxy
  const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  console.log('🔌 Socket URL:', socketUrl || '(empty - using same origin)');

  // For WebSocket connections, we need to pass token in auth object
  // since cookies don't work with WebSocket upgrade
  const socketOptions: SocketOptions = {
    transports: ['websocket', 'polling'],
    withCredentials: true, // This will send cookies for polling transport
    reconnection: true, // Enable auto-reconnection
    reconnectionAttempts: 5, // Try 5 times
    reconnectionDelay: 1000, // Start with 1 second delay
    reconnectionDelayMax: 5000, // Max 5 seconds between attempts
    timeout: 20000, // Connection timeout (20 seconds)
  } as SocketOptions & { path?: string };

  // Add path separately as it's not in SocketOptions type but is supported
  (socketOptions as { path: string }).path = '/socket.io';

  // If token is provided, add it to auth object for WebSocket
  if (token) {
    socketOptions.auth = { token };
    console.log('🔌 Adding token to auth object');
  } else {
    console.log('🔌 No token provided, relying on cookies');
  }

  console.log('🔌 Creating socket with options:', socketOptions);
  socket = io(socketUrl, socketOptions);
  window.socket = socket; // Make available immediately for debugging

  // Create connection promise
  isConnecting = true;
  connectionPromise = new Promise<Socket>((resolve) => {
    const onConnect = () => {
      console.log('🟢 Socket connection promise resolved');
      isConnecting = false;
      if (socket) {
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
        resolve(socket);
      }
    };

    const onError = (error: Error) => {
      console.error('🔴 Socket connection failed:', error);
      isConnecting = false;
      connectionPromise = null;
      if (socket) {
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
      }
    };

    if (socket) {
      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
    }
  });

  // Add detailed error logging
  socket.on('connect_error', (error: Error) => {
    console.error('Socket connection error details:', {
      message: error.message,
      description: (error as { description?: string }).description,
      type: (error as { type?: string }).type,
    });
  });

  socket.on('connect', () => {
    console.log('🟢🟢🟢 Socket CONNECTED! ID:', socket?.id);

    // Get user ID from store using selector
    const state = store.getState();
    const user = selectUser(state);

    if (user && user.id) {
      joinUserRoom(user.id);
    }

    // Fetch initial data
    fetchInitialData();
  });

  socket.on('disconnect', (reason: string) => {
    console.log('🔴🔴🔴 Socket DISCONNECTED! Reason:', reason);
  });

  socket.on('error', (error: unknown) => {
    console.error('⚠️ Socket error event:', error);
  });

  // Listen for backend error events
  socket.on('error_response', (data: ErrorPayload) => {
    console.error('⚠️ Backend error:', data);
  });

  // Listen for successful room joins
  socket.on('chat_room_joined', (data: ChatRoomJoinedPayload) => {
    console.log('✅ Successfully joined chat room:', data);
  });

  // Authentication events
  socket.on('connection_success', (data: ConnectionSuccessPayload) => {
    console.log('Socket authentication successful:', data);
  });

  socket.on('auth_required', (data: AuthPayload) => {
    console.error('Socket authentication required:', data);
  });

  socket.on('auth_error', (data: AuthPayload) => {
    console.error('Socket authentication error:', data);
  });

  // Direct message events
  socket.on('direct_message_threads', (data: DirectMessageThreadsPayload) => {
    console.log('Received direct message threads:', data);
    try {
      // Update RTK Query cache
      if (data && data.threads && Array.isArray(data.threads)) {
        store.dispatch(
          networkingApi.util.updateQueryData(
            'getDirectMessageThreads',
            undefined,
            (draft: Draft<DirectMessageThread[]>) => {
              // Cache should always be an array now
              if (Array.isArray(draft)) {
                // Replace all items
                draft.length = 0;
                draft.push(...data.threads);
              }
              // Don't return anything - Immer handles the modified draft
            },
          ),
        );
      } else {
        console.error('Invalid thread list data received:', data);
      }
    } catch (error) {
      console.error('Error handling direct_message_threads:', error);
    }
  });

  socket.on('direct_messages', (data: DirectMessagesPayload) => {
    console.log('Received direct messages for thread:', data.thread_id);
    // Update RTK Query cache
    if (data && data.thread_id) {
      store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessages',
          { threadId: data.thread_id },
          () => {
            return {
              messages: data.messages || [],
              thread_id: data.thread_id,
              other_user: data.other_user,
              pagination: data.pagination,
              is_encrypted: data.is_encrypted,
            };
          },
        ),
      );
    }
  });

  socket.on('new_direct_message', (data: DirectMessage) => {
    console.log('🔵 Received new direct message:', data);
    console.log('🔵 Thread ID:', data.thread_id, 'Type:', typeof data.thread_id);

    try {
      if (!data || !data.thread_id) {
        console.error('Invalid message data received:', data);
        return;
      }
      const threadId = parseInt(String(data.thread_id));

      // Notify registered callbacks for this thread (for useSocketMessages hook)
      const callback = directMessageCallbacks.get(threadId);
      if (callback) {
        console.log('🔵 Notifying DM callback for thread:', threadId);
        callback({
          type: 'new_message',
          message: data,
        });
      }

      // Update thread list to show latest message
      // Single cache approach - always update undefined cache
      console.log('🔵 Updating thread list...');

      // Update the single cache (no eventId parameter)
      const updateResult = store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessageThreads',
          undefined, // Always use undefined - single cache!
          (draft: Draft<DirectMessageThread[]>) => {
            console.log('🔵 Inside updateQueryData callback, draft:', draft);

            // Cache should always be an array now
            if (!Array.isArray(draft)) {
              console.log('🔵 WARNING: Draft is not an array, type:', typeof draft);
              return; // Early return - no modifications
            }

            const threadIndex = draft.findIndex((t) => t.id === data.thread_id);
            if (threadIndex >= 0) {
              const thread = draft[threadIndex];
              if (thread) {
                thread.last_message = data;
                thread.last_message_at = data.created_at;

                // NOTE: We do NOT increment unread_count here!
                // The backend computes it via schema method (DirectMessageThreadSchema.get_unread_count)
                // which queries for DELIVERED messages. The count will be accurate on next fetch.

                // Move this thread to the top
                draft.splice(threadIndex, 1);
                draft.unshift(thread);
                console.log('🔵 Thread list updated successfully');
              }

              // With Immer, just modify the draft - don't return anything
            } else {
              console.log('🔵 Thread not found in cache (likely deleted), forcing refetch');
              // Thread was deleted or not in cache - need to refetch
              // This happens when user deletes thread (sets cutoff), then receives new message
              // The thread should reappear with the new message

              // First invalidate to mark as stale
              store.dispatch(networkingApi.util.invalidateTags(['Thread']));

              // Then force an immediate refetch to get the updated thread list
              // This ensures deleted threads reappear immediately when new messages arrive
              // NOTE: subscribe: false prevents memory leaks when calling initiate() programmatically
              // (we're not in a component, so no cleanup lifecycle - fire-and-forget is correct)
              store.dispatch(
                networkingApi.endpoints.getDirectMessageThreads.initiate(
                  undefined, // Single cache - no params
                  { forceRefetch: true, subscribe: false },
                ),
              );
              console.log('🔵 Forced refetch of thread list');
              // Don't modify the draft when thread not found
            }
            // Immer will handle returning the modified draft
          },
        ),
      );
      console.log('🔵 Update result:', updateResult);
      console.log(
        '🔵 Patches:',
        updateResult?.patches?.length,
        'InversePatches:',
        updateResult?.inversePatches?.length,
      );

      // Add message to the thread messages
      // Try to update page 1 (most recent messages)
      console.log('🔵 Updating messages for threadId:', data.thread_id);

      // First try to update page 1
      store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessages',
          { threadId: data.thread_id, page: 1 },
          (draft: Draft<DirectMessagesPayload>) => {
            console.log('🔵 Current draft for page 1:', draft);
            if (!draft || !draft.messages) {
              console.log('🔵 No draft or messages array found for page 1');
              return; // Early return - no modifications
            }

            // Check if message already exists
            const messageExists = draft.messages.some((m) => m.id === data.id);
            if (!messageExists) {
              draft.messages.push(data);
              console.log('🔵 Message added to cache, new count:', draft.messages.length);
            } else {
              console.log('🔵 Message already exists, skipping');
            }
            // Don't return - Immer handles it
          },
        ),
      );

      // If page 1 wasn't in cache, try without page (for backwards compatibility)
      if (!updateResult) {
        console.log('🔵 Page 1 not in cache, trying without page number');
        store.dispatch(
          networkingApi.util.updateQueryData(
            'getDirectMessages',
            { threadId: data.thread_id },
            (draft: Draft<DirectMessagesPayload>) => {
              console.log('🔵 Current draft (no page):', draft);
              if (!draft || !draft.messages) return; // Early return - no modifications

              const messageExists = draft.messages.some((m) => m.id === data.id);
              if (!messageExists) {
                draft.messages.push(data);
              }
              // Don't return - Immer handles it
            },
          ),
        );
      }
    } catch (error) {
      console.error('Error handling new_direct_message:', error);
      // Don't crash - just log the error
    }
  });

  // messages_read event - sent to OTHER user (sender) when we read their messages
  // This lets the sender see "read" status on their messages
  // We update OUR OWN unread count via optimistic update in markMessagesRead mutation
  socket.on('messages_read', (data: MessagesReadPayload) => {
    console.log('📬 Messages read notification (for sender):', data);

    try {
      if (!data || !data.thread_id) {
        console.error('Invalid messages_read data received:', data);
        return;
      }
      // Update message status to show "read" checkmarks
      // Only update messages WE sent (sender_id !== reader_id)
      store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessages',
          { threadId: data.thread_id, page: 1 },
          (draft: Draft<DirectMessagesPayload>) => {
            if (!draft || !draft.messages) return; // Early return - no modifications

            draft.messages.forEach((msg) => {
              if (msg.sender_id !== data.reader_id) {
                msg.status = 'READ';
              }
            });
            // Don't return - Immer handles it
          },
        ),
      );

      // Also update cache without page (for backwards compatibility)
      store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessages',
          { threadId: data.thread_id },
          (draft: Draft<DirectMessagesPayload>) => {
            if (!draft || !draft.messages) return; // Early return - no modifications

            draft.messages.forEach((msg) => {
              if (msg.sender_id !== data.reader_id) {
                msg.status = 'READ';
              }
            });
            // Don't return - Immer handles it
          },
        ),
      );
    } catch (error) {
      console.error('Error handling messages_read:', error);
    }
  });

  socket.on('direct_message_thread_created', (data: DirectMessageThread) => {
    console.log('New thread created:', data);

    try {
      if (data && data.id) {
        // Add to thread list
        store.dispatch(
          networkingApi.util.updateQueryData(
            'getDirectMessageThreads',
            undefined,
            (draft: Draft<DirectMessageThread[]>) => {
              if (!Array.isArray(draft)) return;

              const exists = draft.some((t) => t.id === data.id);
              if (!exists) {
                draft.unshift(data);
              }
              // Don't return anything - let Immer handle it
            },
          ),
        );
      } else {
        console.error('Invalid thread creation data received:', data);
      }
    } catch (error) {
      console.error('Error handling direct_message_thread_created:', error);
    }
  });

  // ============================================
  // CHAT ROOM EVENT HANDLERS
  // ============================================

  // Handle message moderation events
  socket.on('chat_message_moderated', (data: ChatMessageModeratedPayload) => {
    console.log('🔴 SOCKET EVENT: chat_message_moderated received:', data);

    if (data && data.room_id && data.message_id) {
      const roomId = parseInt(String(data.room_id));
      const messageId = parseInt(String(data.message_id));

      // Notify the registered callback for this room
      const callback = messageCallbacks.get(roomId);
      if (callback) {
        console.log('🔴 Notifying callback for room:', roomId);
        callback({
          type: 'message_moderated',
          messageId,
          deleted_by: data.deleted_by,
          deleted_at: new Date().toISOString(),
        });
      }

      // Also update the RTK Query cache for backwards compatibility
      // Try to update page 1 cache
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: roomId, page: 1, per_page: 50 },
          (draft: Draft<{ items: ChatMessage[] }>) => {
            if (draft?.items) {
              const messageIndex = draft.items.findIndex((m) => m.id === messageId);
              if (messageIndex >= 0) {
                // Update the message to show as deleted with moderator info
                const message = draft.items[messageIndex];
                if (message) {
                  draft.items[messageIndex] = {
                    ...message,
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: data.deleted_by,
                  };
                }
              }
            }
          },
        ),
      );
    }
  });

  socket.on('chat_message_removed', (data: ChatMessageRemovedPayload) => {
    console.log('🔴 SOCKET EVENT: chat_message_removed received:', data);

    if (data && data.room_id && data.message_id) {
      const roomId = parseInt(String(data.room_id));
      const messageId = parseInt(String(data.message_id));

      // Notify the registered callback for this room
      const callback = messageCallbacks.get(roomId);
      if (callback) {
        console.log('🔴 Notifying callback for room (removed):', roomId);
        callback({
          type: 'message_removed',
          messageId,
        });
      }

      // Remove the message from the cache entirely
      // Try to update page 1 cache
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: roomId, page: 1, per_page: 50 },
          (draft: Draft<{ items: ChatMessage[] }>) => {
            if (draft?.items) {
              draft.items = draft.items.filter((m) => m.id !== messageId);
            }
          },
        ),
      );
    }
  });

  socket.on('new_chat_message', (data: ChatMessage) => {
    console.log('🔵 SOCKET EVENT: new_chat_message received:', data);

    if (data && data.room_id) {
      const roomId = parseInt(String(data.room_id));

      // Notify the registered callback for this room
      const callback = messageCallbacks.get(roomId);
      if (callback) {
        console.log('🔵 Notifying callback for new message in room:', roomId);
        callback({
          type: 'new_message',
          message: data,
        });
      }

      // Also update RTK Query cache for components that might still use it
      // Note: The main ChatRoom uses local state now, but keep for backwards compatibility
      const cacheKey = { chatRoomId: roomId, page: 1, per_page: 50 };

      // Update the cache to append the new message
      const updateResult = store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          cacheKey,
          (draft: Draft<{ items: ChatMessage[] }>) => {
            console.log('🔵 Updating cache for key:', cacheKey);
            console.log('🔵 Current draft:', draft);

            if (!draft) {
              console.log('🔵 No draft found - query might not be active');
              return; // Early return - no modifications
            }

            if (!draft.items) {
              console.log('🔵 No items array in draft');
              draft.items = [];
            }

            // Check if message already exists
            const messageExists = draft.items.some((m) => m.id === data.id);
            if (!messageExists) {
              draft.items.push(data);
              console.log(`🔵 ✅ Added message to cache! New count: ${draft.items.length}`);
            } else {
              console.log('🔵 Message already exists, skipping');
            }

            // Don't return - Immer handles it
          },
        ),
      );

      console.log('🔵 Update result:', updateResult);

      // If the cache update failed (no active query), we might need to let the user know
      if (!updateResult) {
        console.log('🔵 ⚠️ Cache update failed - no active query for this room');
        // Only invalidate if we couldn't update the cache
        store.dispatch(chatApi.util.invalidateTags([{ type: 'ChatMessage', id: roomId }]));
      }
    } else {
      console.log('🔵 No room_id in message data:', data);
    }
  });

  socket.on('chat_notification', (data: ChatNotificationPayload) => {
    console.log('Chat room notification:', data);

    // Update room list with unread counts
    // Note: getChatRooms returns GetChatRoomsResponse which doesn't have unread_count
    // This cache update is skipped as the structure doesn't match
    // Unread counts are managed by the component's local state
  });

  socket.on('chat_room_created', (data: ChatRoomCreatedPayload) => {
    console.log('New chat room created:', data);

    // Invalidate chat rooms list
    if (data && data.event_id) {
      store.dispatch(chatApi.util.invalidateTags([{ type: 'ChatRoom', id: 'LIST' }]));
    }
  });

  socket.on('chat_room_updated', (data: ChatRoomUpdatedPayload) => {
    console.log('Chat room updated:', data);

    // Update specific room
    if (data && data.room_id) {
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRooms',
          data.event_id,
          (draft: Draft<{ chat_rooms: Array<Record<string, unknown>> }>) => {
            if (!draft || !draft.chat_rooms) return; // Early return - no modifications

            const room = draft.chat_rooms.find((r) => (r as { id: number }).id === data.room_id);
            if (room && data.updates) {
              Object.assign(room, data.updates);
            }
            // Don't return - Immer handles it
          },
        ),
      );
    }
  });

  // Room presence events
  socket.on('room_user_count', (data: RoomUserCountPayload) => {
    console.log('Room user count update:', data);

    // Update user count for specific room
    if (data && data.room_id) {
      // Note: PaginatedResponse doesn't have active_users, so we skip this cache update
      // The active_users is managed by the component's local state
    }
  });

  socket.on('user_joined_room', (data: UserJoinedRoomPayload) => {
    console.log('User joined room:', data);

    // Increment user count
    // Note: PaginatedResponse doesn't have active_users, so we skip this cache update
    // The active_users is managed by the component's local state
  });

  socket.on('user_left_room', (data: UserLeftRoomPayload) => {
    console.log('User left room:', data);

    // Decrement user count
    // Note: PaginatedResponse doesn't have active_users, so we skip this cache update
    // The active_users is managed by the component's local state
  });

  // Chat room joined/left events
  socket.on('chat_room_joined', (data: ChatRoomJoinedPayload) => {
    console.log('Successfully joined chat room:', data);

    // Update messages with the initial set
    if (data && data.room_id && data.messages) {
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: data.room_id, page: 1, per_page: 50 },
          (draft: Draft<{ items: ChatMessage[] }>) => {
            if (!draft) return; // Early return if no draft
            draft.items = data.messages;
            // Don't return - Immer handles it
          },
        ),
      );
    }
  });

  socket.on('chat_room_left', (data: ChatRoomLeftPayload) => {
    console.log('Left chat room:', data);
  });

  // Presence tracking events (duplicate handler - keeping for compatibility)
  socket.on('room_user_count', (data: RoomUserCountPayload) => {
    console.log('🟢 Room user count updated:', data);

    if (data && data.room_id) {
      const roomId = parseInt(String(data.room_id));
      const callback = roomPresenceCallbacks.get(roomId);

      if (callback) {
        callback({
          type: 'user_count_update',
          room_id: roomId,
          user_count: data.user_count,
        });
      }
    }
  });

  // Typing indicator events
  socket.on('typing_in_dm', (data: TypingInDMPayload) => {
    console.log('⌨️ Typing in DM:', data);

    if (data && data.thread_id) {
      const threadId = parseInt(String(data.thread_id));
      const callback = dmTypingCallbacks.get(threadId);

      if (callback) {
        callback({
          type: 'typing_status',
          thread_id: threadId,
          user_id: data.user_id,
          is_typing: data.is_typing,
        });
      }
    }
  });

  return socket;
};

// ─────────────────────────────────────────────────────────────────────────────
// Socket Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

export const getSocket = (): Socket | null => {
  // Check same env variable as initializeSocket
  const FORCE_HTTP_FALLBACK = import.meta.env.VITE_FORCE_HTTP_FALLBACK === 'true';

  if (FORCE_HTTP_FALLBACK) {
    console.log('⚠️ getSocket: WebSocket disabled via env - returning null');
    return null;
  }

  console.log(
    '🔌 getSocket called, socket is:',
    socket ? 'EXISTS' : 'NULL',
    'connected:',
    socket?.connected,
  );
  return socket;
};

export const waitForSocket = async (): Promise<Socket | null> => {
  console.log('⏳ waitForSocket called');

  if (socket && socket.connected) {
    console.log('✅ Socket already connected');
    return socket;
  }

  if (connectionPromise) {
    console.log('⏳ Waiting for connection promise...');
    return connectionPromise;
  }

  console.log('❌ No socket or connection promise available');
  return null;
};

export const disconnectSocket = (): void => {
  if (socket) {
    console.log('🔌 disconnectSocket called - skipping in development to maintain connection');
    // In development, React StrictMode causes double-rendering
    // Don't actually disconnect to maintain real-time functionality
    if (process.env.NODE_ENV === 'production') {
      socket.disconnect();
      socket = null;
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Callback Registration Functions
// ─────────────────────────────────────────────────────────────────────────────

// Register a callback for message updates in a specific room
export const registerMessageCallback = (roomId: number, callback: ChatMessageCallback): void => {
  console.log('🔌 Registering message callback for room:', roomId);
  messageCallbacks.set(roomId, callback);
};

// Unregister a callback for a specific room
export const unregisterMessageCallback = (roomId: number): void => {
  console.log('🔌 Unregistering message callback for room:', roomId);
  messageCallbacks.delete(roomId);
};

// Register a callback for direct message updates in a specific thread
export const registerDirectMessageCallback = (
  threadId: number,
  callback: DirectMessageCallback,
): void => {
  console.log('🔌 Registering DM callback for thread:', threadId);
  directMessageCallbacks.set(threadId, callback);
};

// Unregister a callback for a specific thread
export const unregisterDirectMessageCallback = (threadId: number): void => {
  console.log('🔌 Unregistering DM callback for thread:', threadId);
  directMessageCallbacks.delete(threadId);
};

// Register a callback for room presence updates
export const registerRoomPresenceCallback = (
  roomId: number,
  callback: RoomPresenceCallback,
): void => {
  console.log('🔌 Registering room presence callback for room:', roomId);
  roomPresenceCallbacks.set(roomId, callback);
};

// Unregister a callback for room presence
export const unregisterRoomPresenceCallback = (roomId: number): void => {
  console.log('🔌 Unregistering room presence callback for room:', roomId);
  roomPresenceCallbacks.delete(roomId);
};

// Register a callback for DM typing indicators
export const registerDMTypingCallback = (threadId: number, callback: TypingCallback): void => {
  console.log('🔌 Registering DM typing callback for thread:', threadId);
  dmTypingCallbacks.set(threadId, callback);
};

// Unregister a callback for DM typing
export const unregisterDMTypingCallback = (threadId: number): void => {
  console.log('🔌 Unregistering DM typing callback for thread:', threadId);
  dmTypingCallbacks.delete(threadId);
};

// ─────────────────────────────────────────────────────────────────────────────
// Initial Data Fetching
// ─────────────────────────────────────────────────────────────────────────────

// Fetch initial data
export const fetchInitialData = (): Promise<DirectMessageThreadsPayload> => {
  if (!socket || !socket.connected) {
    console.warn('Cannot fetch initial data: Socket not connected');
    return Promise.reject(new Error('Socket not connected'));
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot fetch initial data: User not authenticated');
    return Promise.reject(new Error('User not authenticated'));
  }

  console.log('Fetching initial chat data');

  // Get direct message threads
  return getDirectMessageThreads()
    .then((response) => {
      console.log('Initial data fetched successfully');
      return response;
    })
    .catch((error) => {
      console.error('Error fetching initial data:', error);
      throw error;
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Direct Message Socket Emitters
// ─────────────────────────────────────────────────────────────────────────────

// Socket event emitters with Promise wrappers
export const getDirectMessageThreads = (): Promise<DirectMessageThreadsPayload> => {
  if (!socket || !socket.connected) {
    console.warn('Cannot get threads: Socket not connected');
    return Promise.reject(new Error('Socket not connected'));
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot get threads: User not authenticated');
    return Promise.reject(new Error('User not authenticated'));
  }

  console.log('Requesting direct message threads');

  return new Promise<DirectMessageThreadsPayload>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not available'));
      return;
    }

    // Create a one-time event listener for the response
    const onThreadsReceived = (data: DirectMessageThreadsPayload) => {
      console.log('Received threads in promise handler:', data);
      resolve(data);
      // Remove the listener to avoid memory leaks
      socket?.off('direct_message_threads', onThreadsReceived);
      clearTimeout(timeoutId);
    };

    // Set up the listener before emitting
    socket.once('direct_message_threads', onThreadsReceived);

    // Emit the request
    socket.emit('get_direct_message_threads', {});

    // Add timeout for socket response
    const timeoutId = setTimeout(() => {
      console.warn('Socket request for threads timed out');
      // Remove the listener to avoid memory leaks
      socket?.off('direct_message_threads', onThreadsReceived);
      reject(new Error('Socket request timed out'));
    }, 3000); // Reduced timeout to 3 seconds for faster fallback
  });
};

export const getDirectMessages = (
  threadId: number,
  page = 1,
  perPage = 50,
): Promise<DirectMessagesPayload> => {
  if (!socket || !socket.connected) {
    console.warn('Cannot get messages: Socket not connected');
    return Promise.reject(new Error('Socket not connected'));
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot get messages: User not authenticated');
    return Promise.reject(new Error('User not authenticated'));
  }

  console.log(`Requesting direct messages for thread ${threadId}, page ${page}`);

  return new Promise<DirectMessagesPayload>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not available'));
      return;
    }

    // Create a one-time event listener for the response
    const onMessagesReceived = (data: DirectMessagesPayload) => {
      if (data.thread_id === parseInt(String(threadId))) {
        console.log('Received messages in promise handler:', data);
        resolve(data);
        // Remove the listener to avoid memory leaks
        socket?.off('direct_messages', onMessagesReceived);
        clearTimeout(timeoutId);
      }
    };

    // Set up the listener before emitting
    socket.on('direct_messages', onMessagesReceived);

    // Emit the request
    socket.emit('get_direct_messages', {
      thread_id: threadId,
      page,
      per_page: perPage,
    });

    // Add timeout for socket response
    const timeoutId = setTimeout(() => {
      console.warn('Socket request for messages timed out');
      // Remove the listener to avoid memory leaks
      socket?.off('direct_messages', onMessagesReceived);
      reject(new Error('Socket request timed out'));
    }, 3000); // Reduced timeout to 3 seconds for faster fallback
  });
};

export const sendDirectMessage = (
  threadId: number,
  content: string,
  encryptedContent: string | null = null,
): Promise<DirectMessage> => {
  if (!socket || !socket.connected) {
    console.warn('Cannot send message: Socket not connected');
    return Promise.reject(new Error('Socket not connected'));
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot send message: User not authenticated');
    return Promise.reject(new Error('User not authenticated'));
  }

  console.log(`Sending message to thread ${threadId}`);

  return new Promise<DirectMessage>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not available'));
      return;
    }

    // Create a one-time event listener for the response
    const onMessageSent = (data: DirectMessage) => {
      if (data.thread_id === parseInt(String(threadId))) {
        console.log('Message sent successfully:', data);
        resolve(data);
        // Remove the listener to avoid memory leaks
        socket?.off('direct_message_sent', onMessageSent);
        clearTimeout(timeoutId);
      }
    };

    // Set up the listener before emitting
    socket.once('direct_message_sent', onMessageSent);

    // Emit the request
    socket.emit('send_direct_message', {
      thread_id: threadId,
      content,
      encrypted_content: encryptedContent,
    });

    // Add timeout for socket response
    const timeoutId = setTimeout(() => {
      console.warn('Socket request for sending message timed out');
      socket?.off('direct_message_sent', onMessageSent);
      reject(new Error('Socket request timed out'));
    }, 3000); // Reduced timeout to 3 seconds for faster fallback
  });
};

export const markMessagesRead = (threadId: number): Promise<{ thread_id: number }> => {
  if (!socket || !socket.connected) {
    console.warn('Cannot mark messages read: Socket not connected');
    return Promise.reject(new Error('Socket not connected'));
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot mark messages read: User not authenticated');
    return Promise.reject(new Error('User not authenticated'));
  }

  console.log(`Marking messages as read in thread ${threadId}`);

  return new Promise<{ thread_id: number }>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not available'));
      return;
    }

    // Create a one-time event listener for the response
    const onMessagesMarkedRead = (data: { thread_id: number }) => {
      if (data.thread_id === parseInt(String(threadId))) {
        console.log('Messages marked as read:', data);
        resolve(data);
        // Remove the listener to avoid memory leaks
        socket?.off('messages_marked_read', onMessagesMarkedRead);
        clearTimeout(timeoutId);
      }
    };

    // Set up the listener before emitting
    socket.once('messages_marked_read', onMessagesMarkedRead);

    // Emit the request
    socket.emit('mark_messages_read', { thread_id: threadId });

    // Add timeout for socket response
    const timeoutId = setTimeout(() => {
      console.warn('Socket request for marking messages read timed out');
      socket?.off('messages_marked_read', onMessagesMarkedRead);
      reject(new Error('Socket request timed out'));
    }, 3000); // Reduced timeout to 3 seconds for faster fallback
  });
};

export const createDirectMessageThread = (
  userId: number,
  eventId: number | null = null,
): Promise<DirectMessageThread> => {
  if (!socket || !socket.connected) {
    console.warn('Cannot create thread: Socket not connected');
    return Promise.reject(new Error('Socket not connected'));
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot create thread: User not authenticated');
    return Promise.reject(new Error('User not authenticated'));
  }

  console.log(`Creating direct message thread with user ${userId}`);

  return new Promise<DirectMessageThread>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not available'));
      return;
    }

    // Create a one-time event listener for the response
    const onThreadCreated = (data: DirectMessageThread) => {
      if (data.other_user && data.other_user.id === parseInt(String(userId))) {
        console.log('Thread created successfully:', data);
        resolve(data);
        // Remove the listener to avoid memory leaks
        socket?.off('direct_message_thread_created', onThreadCreated);
        clearTimeout(timeoutId);
      }
    };

    // Set up the listener before emitting
    socket.once('direct_message_thread_created', onThreadCreated);

    // Emit the request
    // Emit with optional event context for admin messaging
    const payload: { user_id: number; event_id?: number } = { user_id: userId };
    if (eventId) {
      payload.event_id = eventId;
    }
    socket.emit('create_direct_message_thread', payload);

    // Add timeout for socket response
    const timeoutId = setTimeout(() => {
      console.warn('Socket request for creating thread timed out');
      socket?.off('direct_message_thread_created', onThreadCreated);
      reject(new Error('Socket request timed out'));
    }, 3000); // Reduced timeout to 3 seconds for faster fallback
  });
};

// Join user's room for receiving messages
export const joinUserRoom = (userId: number): void => {
  if (!socket || !socket.connected) {
    console.warn('Cannot join user room: Socket not connected');
    return;
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot join user room: User not authenticated');
    return;
  }

  console.log(`Joining user room for user ${userId}`);
  socket.emit('join_user_room', { user_id: userId });
};

// ─────────────────────────────────────────────────────────────────────────────
// Chat Room Emitters
// ─────────────────────────────────────────────────────────────────────────────

// Join a specific chat room for direct updates
export const joinChatRoom = async (roomId: number): Promise<ChatRoomJoinedPayload> => {
  console.log(`🟢 joinChatRoom called for room ${roomId}`);

  // Wait for socket connection first
  const connectedSocket = await waitForSocket();

  if (!connectedSocket || !connectedSocket.connected) {
    console.warn('Cannot join chat room: Socket not connected after waiting');
    return Promise.reject(new Error('Socket not connected'));
  }

  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot join chat room: User not authenticated');
    return Promise.reject(new Error('User not authenticated'));
  }

  console.log(`🟢 JOINING chat room ${roomId}`);

  return new Promise<ChatRoomJoinedPayload>((resolve) => {
    // Set up one-time listener for join confirmation
    const onJoined = (data: ChatRoomJoinedPayload) => {
      if (data.room_id === parseInt(String(roomId))) {
        console.log(`🟢 CONFIRMED join for room ${roomId}:`, data);
        connectedSocket.off('chat_room_joined', onJoined);
        clearTimeout(timeoutId);
        resolve(data);
      }
    };

    connectedSocket.once('chat_room_joined', onJoined);

    // Emit the join request
    connectedSocket.emit('join_chat_room', { room_id: parseInt(String(roomId)) });
    console.log(`🟢 EMITTED join_chat_room for room ${roomId}`);

    // Fallback timeout in case no confirmation
    const timeoutId = setTimeout(() => {
      console.log(`🟢 TIMEOUT: Assuming join succeeded for room ${roomId}`);
      connectedSocket.off('chat_room_joined', onJoined);
      resolve({ room_id: roomId, room_name: '', messages: [], user_count: 0 });
    }, 1000);
  });
};

// Leave a chat room
export const leaveChatRoom = (roomId: number): Promise<ChatRoomLeftPayload> => {
  if (!socket || !socket.connected) {
    console.warn('Cannot leave chat room: Socket not connected');
    return Promise.resolve({ room_id: roomId }); // Return resolved promise for consistency
  }

  console.log(`🔴 LEAVING chat room ${roomId}`);

  return new Promise<ChatRoomLeftPayload>((resolve) => {
    if (!socket) {
      resolve({ room_id: roomId });
      return;
    }

    // Set up one-time listener for leave confirmation
    const onLeft = (data: ChatRoomLeftPayload) => {
      if (data.room_id === parseInt(String(roomId))) {
        console.log(`🔴 CONFIRMED leave for room ${roomId}:`, data);
        if (socket) {
          socket.off('chat_room_left', onLeft);
        }
        clearTimeout(timeoutId);
        resolve(data);
      }
    };

    socket.once('chat_room_left', onLeft);

    // Emit the leave request
    socket.emit('leave_chat_room', { room_id: parseInt(String(roomId)) });
    console.log(`🔴 EMITTED leave_chat_room for room ${roomId}`);

    // Fallback timeout in case no confirmation (shorter than join since leave is simpler)
    const timeoutId = setTimeout(() => {
      console.log(`🔴 TIMEOUT: Assuming leave succeeded for room ${roomId}`);
      if (socket) {
        socket.off('chat_room_left', onLeft);
      }
      resolve({ room_id: roomId });
    }, 500); // 500ms timeout for leave operations
  });
};

// Smart room subscription - only subscribe to active room
export const setActiveChatRoom = async (roomId: number | null): Promise<void> => {
  console.log(`🎯 setActiveChatRoom called with roomId: ${roomId}`);

  // Leave previous room if different - AWAIT to ensure it completes first
  if (activeChatRoom && activeChatRoom !== roomId) {
    try {
      await leaveChatRoom(activeChatRoom);
      console.log(`✅ Successfully left room ${activeChatRoom} before joining ${roomId}`);
    } catch (error) {
      console.error(`❌ Error leaving room ${activeChatRoom}:`, error);
      // Continue anyway - don't block joining the new room
    }
  }

  // Join new room
  if (roomId) {
    try {
      await joinChatRoom(roomId);
      activeChatRoom = roomId;
      console.log(`✅ Active chat room set to ${roomId}`);
    } catch (error) {
      console.error('❌ Failed to join chat room:', error);
      activeChatRoom = null; // Reset on failure
    }
  } else {
    // Explicitly leaving all rooms (setting to null)
    if (activeChatRoom) {
      try {
        await leaveChatRoom(activeChatRoom);
        console.log(`✅ Left room ${activeChatRoom} (setting active to null)`);
      } catch (error) {
        console.error(`❌ Error leaving room ${activeChatRoom}:`, error);
      }
    }
    activeChatRoom = null;
  }
};

// Get current active room
export const getActiveChatRoom = (): number | null => activeChatRoom;

// Send message to chat room (via Socket.IO)
export const sendChatMessage = (roomId: number, content: string): Promise<ChatMessage> => {
  if (!socket || !socket.connected) {
    console.warn('Cannot send chat message: Socket not connected');
    return Promise.reject(new Error('Socket not connected'));
  }

  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot send chat message: User not authenticated');
    return Promise.reject(new Error('User not authenticated'));
  }

  console.log(`Sending message to chat room ${roomId}`);

  return new Promise<ChatMessage>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not available'));
      return;
    }

    const onMessageSent = (data: ChatMessage) => {
      if (data.room_id === parseInt(String(roomId))) {
        console.log('Chat message sent successfully:', data);
        resolve(data);
        if (socket) {
          socket.off('chat_message_sent', onMessageSent);
        }
        clearTimeout(timeoutId);
      }
    };

    socket.once('chat_message_sent', onMessageSent);
    socket.emit('chat_message', {
      room_id: roomId,
      content: content.trim(),
    });

    const timeoutId = setTimeout(() => {
      console.warn('Socket request for sending chat message timed out');
      if (socket) {
        socket.off('chat_message_sent', onMessageSent);
      }
      reject(new Error('Socket request timed out'));
    }, 5000);
  });
};

// Get list of chat rooms (one-time fetch)
export const getChatRooms = (eventId: number): Promise<ChatRoomsPayload> => {
  if (!socket || !socket.connected) {
    console.warn('Cannot get chat rooms: Socket not connected');
    return Promise.reject(new Error('Socket not connected'));
  }

  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot get chat rooms: User not authenticated');
    return Promise.reject(new Error('User not authenticated'));
  }

  console.log(`Requesting chat rooms for event ${eventId}`);

  return new Promise<ChatRoomsPayload>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not available'));
      return;
    }

    const onRoomsReceived = (data: ChatRoomsPayload) => {
      console.log('Received chat rooms:', data);
      resolve(data);
      if (socket) {
        socket.off('chat_rooms', onRoomsReceived);
      }
      clearTimeout(timeoutId);
    };

    socket.once('chat_rooms', onRoomsReceived);
    socket.emit('get_chat_rooms', { event_id: eventId });

    const timeoutId = setTimeout(() => {
      console.warn('Socket request for chat rooms timed out');
      if (socket) {
        socket.off('chat_rooms', onRoomsReceived);
      }
      reject(new Error('Socket request timed out'));
    }, 10000);
  });
};

// Join event for general notifications
export const joinEventNotifications = (eventId: number): void => {
  if (!socket || !socket.connected) {
    console.warn('Cannot join event: Socket not connected');
    return;
  }

  console.log(`Joining event ${eventId} for notifications`);
  if (socket) {
    socket.emit('join_event', { event_id: eventId });
  }
};

// Leave event notifications
export const leaveEventNotifications = (eventId: number): void => {
  if (!socket || !socket.connected) {
    console.warn('Cannot leave event: Socket not connected');
    return;
  }

  console.log(`Leaving event ${eventId} notifications`);
  if (socket) {
    socket.emit('leave_event', { event_id: eventId });
  }
};

// Join event admin monitoring room
export const joinEventAdmin = (eventId: number): void => {
  if (!socket || !socket.connected) {
    console.warn('Cannot join event admin: Socket not connected');
    return;
  }

  console.log(`🔧 Joining event ${eventId} admin monitoring`);
  if (socket) {
    socket.emit('join_event_admin', { event_id: eventId });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Session Chat Room Emitters
// ─────────────────────────────────────────────────────────────────────────────

// Join all chat rooms for a session
export const joinSessionChatRooms = (sessionId: number): void => {
  if (!socket || !socket.connected) {
    console.warn('Cannot join session chat rooms: Socket not connected');
    return;
  }

  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot join session chat rooms: User not authenticated');
    return;
  }

  console.log(`Joining chat rooms for session ${sessionId}`);
  if (socket) {
    socket.emit('join_session_chat_rooms', { session_id: sessionId });
  }
};

// Leave all chat rooms for a session
export const leaveSessionChatRooms = (sessionId: number): void => {
  if (!socket || !socket.connected) {
    console.warn('Cannot leave session chat rooms: Socket not connected');
    return;
  }

  console.log(`Leaving chat rooms for session ${sessionId}`);
  if (socket) {
    socket.emit('leave_session_chat_rooms', { session_id: sessionId });
  }
};
