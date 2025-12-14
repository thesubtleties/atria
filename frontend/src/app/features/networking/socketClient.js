// src/app/features/networking/socketClient.js
import { io } from 'socket.io-client';
import { store } from '../../store';
import { networkingApi } from './api';
import { chatApi } from '../chat/api';
import { selectUser, selectIsAuthenticated } from '../../store/authSlice';

let socket = null;
let connectionPromise = null;
let isConnecting = false;
let messageCallbacks = new Map(); // Map of roomId -> callback function for chat rooms
let directMessageCallbacks = new Map(); // Map of threadId -> callback function for DMs
let roomPresenceCallbacks = new Map(); // Map of roomId -> callback for presence updates
let dmTypingCallbacks = new Map(); // Map of threadId -> callback for typing indicators

export const initializeSocket = (token = null) => {
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
    return connectionPromise;
  }

  // Make socket globally available for debugging
  window.socket = null;

  console.log('🔌 Initializing NEW socket connection with token:', token ? 'YES' : 'NO');

  // Connect using the proxy
  const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  console.log('🔌 Socket URL:', socketUrl || '(empty - using same origin)');

  // For WebSocket connections, we need to pass token in auth object
  // since cookies don't work with WebSocket upgrade
  const socketOptions = {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true, // This will send cookies for polling transport
    reconnection: true, // Enable auto-reconnection
    reconnectionAttempts: 5, // Try 5 times
    reconnectionDelay: 1000, // Start with 1 second delay
    reconnectionDelayMax: 5000, // Max 5 seconds between attempts
    timeout: 20000, // Connection timeout (20 seconds)
  };

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
  connectionPromise = new Promise((resolve) => {
    const onConnect = () => {
      console.log('🟢 Socket connection promise resolved');
      isConnecting = false;
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      resolve(socket);
    };

    const onError = (error) => {
      console.error('🔴 Socket connection failed:', error);
      isConnecting = false;
      connectionPromise = null;
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
    };

    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
  });

  // Add detailed error logging
  socket.on('connect_error', (error) => {
    console.error('Socket connection error details:', {
      message: error.message,
      description: error.description,
      type: error.type,
    });
  });

  socket.on('connect', () => {
    console.log('🟢🟢🟢 Socket CONNECTED! ID:', socket.id);

    // Get user ID from store using selector
    const state = store.getState();
    const user = selectUser(state);

    if (user && user.id) {
      joinUserRoom(user.id);
    }

    // Fetch initial data
    fetchInitialData();
  });

  socket.on('disconnect', (reason) => {
    console.log('🔴🔴🔴 Socket DISCONNECTED! Reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('⚠️ Socket error event:', error);
  });

  // Listen for backend error events
  socket.on('error_response', (data) => {
    console.error('⚠️ Backend error:', data);
  });

  // Listen for successful room joins
  socket.on('chat_room_joined', (data) => {
    console.log('✅ Successfully joined chat room:', data);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  // Authentication events
  socket.on('connection_success', (data) => {
    console.log('Socket authentication successful:', data);
  });

  socket.on('auth_required', (data) => {
    console.error('Socket authentication required:', data);
  });

  socket.on('auth_error', (data) => {
    console.error('Socket authentication error:', data);
  });

  // Direct message events
  socket.on('direct_message_threads', (data) => {
    console.log('Received direct message threads:', data);
    try {
      // Update RTK Query cache
      if (data && data.threads && Array.isArray(data.threads)) {
        store.dispatch(
          networkingApi.util.updateQueryData('getDirectMessageThreads', undefined, (draft) => {
            // Cache should always be an array now
            if (Array.isArray(draft)) {
              // Replace all items
              draft.length = 0;
              draft.push(...data.threads);
            }
            // Don't return anything - Immer handles the modified draft
          }),
        );
      } else {
        console.error('Invalid thread list data received:', data);
      }
    } catch (error) {
      console.error('Error handling direct_message_threads:', error);
    }
  });

  socket.on('direct_messages', (data) => {
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

  socket.on('new_direct_message', (data) => {
    console.log('🔵 Received new direct message:', data);
    console.log('🔵 Thread ID:', data.thread_id, 'Type:', typeof data.thread_id);

    try {
      if (!data || !data.thread_id) {
        console.error('Invalid message data received:', data);
        return;
      }
      const threadId = parseInt(data.thread_id);

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
          (draft) => {
            console.log('🔵 Inside updateQueryData callback, draft:', draft);

            // Cache should always be an array now
            if (!Array.isArray(draft)) {
              console.log('🔵 WARNING: Draft is not an array, type:', typeof draft);
              return; // Early return - no modifications
            }

            const threadIndex = draft.findIndex((t) => t.id === data.thread_id);
            if (threadIndex >= 0) {
              draft[threadIndex].last_message = data;
              draft[threadIndex].last_message_at = data.created_at;

              // NOTE: We do NOT increment unread_count here!
              // The backend computes it via schema method (DirectMessageThreadSchema.get_unread_count)
              // which queries for DELIVERED messages. The count will be accurate on next fetch.

              // Move this thread to the top
              const thread = draft[threadIndex];
              draft.splice(threadIndex, 1);
              draft.unshift(thread);
              console.log('🔵 Thread list updated successfully');

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
          (draft) => {
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
      if (!updateResult.data) {
        console.log('🔵 Page 1 not in cache, trying without page number');
        store.dispatch(
          networkingApi.util.updateQueryData(
            'getDirectMessages',
            { threadId: data.thread_id },
            (draft) => {
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
  socket.on('messages_read', (data) => {
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
          (draft) => {
            if (!draft || !draft.messages) return; // Early return - no modifications

            draft.messages.forEach((msg) => {
              if (msg.sender_id !== data.reader_id) {
                msg.status = 'read'; // lowercase to match backend enum and UI
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
          (draft) => {
            if (!draft || !draft.messages) return; // Early return - no modifications

            draft.messages.forEach((msg) => {
              if (msg.sender_id !== data.reader_id) {
                msg.status = 'read'; // lowercase to match backend enum and UI
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

  socket.on('direct_message_thread_created', (data) => {
    console.log('New thread created:', data);

    try {
      if (data && data.id) {
        // Add to thread list
        store.dispatch(
          networkingApi.util.updateQueryData('getDirectMessageThreads', undefined, (draft) => {
            if (!Array.isArray(draft)) return;

            const exists = draft.some((t) => t.id === data.id);
            if (!exists) {
              draft.unshift(data);
            }
            // Don't return anything - let Immer handle it
          }),
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
  socket.on('chat_message_moderated', (data) => {
    console.log('🔴 SOCKET EVENT: chat_message_moderated received:', data);

    if (data && data.room_id && data.message_id) {
      const roomId = parseInt(data.room_id);
      const messageId = parseInt(data.message_id);

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
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: roomId, limit: 100, offset: 0 },
          (draft) => {
            if (draft?.messages) {
              const messageIndex = draft.messages.findIndex((m) => m.id === messageId);
              if (messageIndex >= 0) {
                // Update the message to show as deleted with moderator info
                draft.messages[messageIndex] = {
                  ...draft.messages[messageIndex],
                  is_deleted: true,
                  deleted_at: new Date().toISOString(),
                  deleted_by: data.deleted_by,
                };
              }
            }
          },
        ),
      );
    }
  });

  socket.on('chat_message_removed', (data) => {
    console.log('🔴 SOCKET EVENT: chat_message_removed received:', data);

    if (data && data.room_id && data.message_id) {
      const roomId = parseInt(data.room_id);
      const messageId = parseInt(data.message_id);

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
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: roomId, limit: 100, offset: 0 },
          (draft) => {
            if (draft?.messages) {
              draft.messages = draft.messages.filter((m) => m.id !== messageId);
            }
          },
        ),
      );
    }
  });

  socket.on('new_chat_message', (data) => {
    console.log('🔵 SOCKET EVENT: new_chat_message received:', data);

    if (data && data.room_id) {
      const roomId = parseInt(data.room_id);

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
        chatApi.util.updateQueryData('getChatRoomMessages', cacheKey, (draft) => {
          console.log('🔵 Updating cache for key:', cacheKey);
          console.log('🔵 Current draft:', draft);

          if (!draft) {
            console.log('🔵 No draft found - query might not be active');
            return; // Early return - no modifications
          }

          if (!draft.messages) {
            console.log('🔵 No messages array in draft');
            draft.messages = [];
          }

          // Check if message already exists
          const messageExists = draft.messages.some((m) => m.id === data.id);
          if (!messageExists) {
            draft.messages.push(data);
            console.log(`🔵 ✅ Added message to cache! New count: ${draft.messages.length}`);
          } else {
            console.log('🔵 Message already exists, skipping');
          }

          // Don't return - Immer handles it
        }),
      );

      console.log('🔵 Update result:', updateResult);

      // If the cache update failed (no active query), we might need to let the user know
      if (!updateResult.data) {
        console.log('🔵 ⚠️ Cache update failed - no active query for this room');
        // Only invalidate if we couldn't update the cache
        store.dispatch(chatApi.util.invalidateTags([{ type: 'ChatMessage', id: roomId }]));
      }
    } else {
      console.log('🔵 No room_id in message data:', data);
    }
  });

  socket.on('chat_notification', (data) => {
    console.log('Chat room notification:', data);

    // Update room list with unread counts
    if (data && data.room_id) {
      store.dispatch(
        chatApi.util.updateQueryData('getChatRooms', data.event_id, (draft) => {
          if (!draft || !draft.chat_rooms) return; // Early return - no modifications

          const room = draft.chat_rooms.find((r) => r.id === data.room_id);
          if (room) {
            room.unread_count = data.unread_count;
            room.latest_message = data.latest_message;
            room.updated_at = data.updated_at;
          }
          // Don't return - Immer handles it
        }),
      );
    }
  });

  socket.on('chat_room_created', (data) => {
    console.log('New chat room created:', data);

    // Invalidate chat rooms list
    if (data && data.event_id) {
      store.dispatch(chatApi.util.invalidateTags([{ type: 'ChatRoom', id: 'LIST' }]));
    }
  });

  socket.on('chat_room_updated', (data) => {
    console.log('Chat room updated:', data);

    // Update specific room
    if (data && data.room_id) {
      store.dispatch(
        chatApi.util.updateQueryData('getChatRooms', data.event_id, (draft) => {
          if (!draft || !draft.chat_rooms) return; // Early return - no modifications

          const room = draft.chat_rooms.find((r) => r.id === data.room_id);
          if (room && data.updates) {
            Object.assign(room, data.updates);
          }
          // Don't return - Immer handles it
        }),
      );
    }
  });

  // Room presence events
  socket.on('room_user_count', (data) => {
    console.log('Room user count update:', data);

    // Update user count for specific room
    if (data && data.room_id) {
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: data.room_id },
          (draft) => {
            if (!draft) return; // Early return - no modifications
            // Store user count in the response
            draft.active_users = data.user_count;
            // Don't return - Immer handles it
          },
        ),
      );
    }
  });

  socket.on('user_joined_room', (data) => {
    console.log('User joined room:', data);

    // Increment user count
    if (data && data.room_id) {
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: data.room_id },
          (draft) => {
            if (!draft) return; // Early return - no modifications
            draft.active_users = (draft.active_users || 0) + 1;
            // Don't return - Immer handles it
          },
        ),
      );
    }
  });

  socket.on('user_left_room', (data) => {
    console.log('User left room:', data);

    // Decrement user count
    if (data && data.room_id) {
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: data.room_id },
          (draft) => {
            if (!draft) return; // Early return - no modifications
            draft.active_users = Math.max(0, (draft.active_users || 1) - 1);
            // Don't return - Immer handles it
          },
        ),
      );
    }
  });

  // Chat room joined/left events
  socket.on('chat_room_joined', (data) => {
    console.log('Successfully joined chat room:', data);

    // Update messages with the initial set
    if (data && data.room_id && data.messages) {
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: data.room_id },
          (draft) => {
            if (!draft) return { messages: data.messages }; // Replacement pattern - valid
            draft.messages = data.messages;
            // Don't return - Immer handles it
          },
        ),
      );
    }
  });

  socket.on('chat_room_left', (data) => {
    console.log('Left chat room:', data);
  });

  // Presence tracking events
  socket.on('room_user_count', (data) => {
    console.log('🟢 Room user count updated:', data);

    if (data && data.room_id) {
      const roomId = parseInt(data.room_id);
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
  socket.on('typing_in_dm', (data) => {
    console.log('⌨️ Typing in DM:', data);

    if (data && data.thread_id) {
      const threadId = parseInt(data.thread_id);
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

export const getSocket = () => {
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

// Register a callback for message updates in a specific room
export const registerMessageCallback = (roomId, callback) => {
  console.log('🔌 Registering message callback for room:', roomId);
  messageCallbacks.set(roomId, callback);
};

// Unregister a callback for a specific room
export const unregisterMessageCallback = (roomId) => {
  console.log('🔌 Unregistering message callback for room:', roomId);
  messageCallbacks.delete(roomId);
};

// Register a callback for direct message updates in a specific thread
export const registerDirectMessageCallback = (threadId, callback) => {
  console.log('🔌 Registering DM callback for thread:', threadId);
  directMessageCallbacks.set(threadId, callback);
};

// Unregister a callback for a specific thread
export const unregisterDirectMessageCallback = (threadId) => {
  console.log('🔌 Unregistering DM callback for thread:', threadId);
  directMessageCallbacks.delete(threadId);
};

// Register a callback for room presence updates
export const registerRoomPresenceCallback = (roomId, callback) => {
  console.log('🔌 Registering room presence callback for room:', roomId);
  roomPresenceCallbacks.set(roomId, callback);
};

// Unregister a callback for room presence
export const unregisterRoomPresenceCallback = (roomId) => {
  console.log('🔌 Unregistering room presence callback for room:', roomId);
  roomPresenceCallbacks.delete(roomId);
};

// Register a callback for DM typing indicators
export const registerDMTypingCallback = (threadId, callback) => {
  console.log('🔌 Registering DM typing callback for thread:', threadId);
  dmTypingCallbacks.set(threadId, callback);
};

// Unregister a callback for DM typing
export const unregisterDMTypingCallback = (threadId) => {
  console.log('🔌 Unregistering DM typing callback for thread:', threadId);
  dmTypingCallbacks.delete(threadId);
};

export const waitForSocket = async () => {
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

export const disconnectSocket = () => {
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

// Fetch initial data
export const fetchInitialData = () => {
  if (!socket || !socket.connected) {
    console.warn('Cannot fetch initial data: Socket not connected');
    return Promise.reject('Socket not connected');
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot fetch initial data: User not authenticated');
    return Promise.reject('User not authenticated');
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

// Socket event emitters with Promise wrappers
export const getDirectMessageThreads = () => {
  if (!socket || !socket.connected) {
    console.warn('Cannot get threads: Socket not connected');
    return Promise.reject('Socket not connected');
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot get threads: User not authenticated');
    return Promise.reject('User not authenticated');
  }

  console.log('Requesting direct message threads');

  return new Promise((resolve, reject) => {
    // Create a one-time event listener for the response
    const onThreadsReceived = (data) => {
      console.log('Received threads in promise handler:', data);
      resolve(data);
      // Remove the listener to avoid memory leaks
      socket.off('direct_message_threads', onThreadsReceived);
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
      socket.off('direct_message_threads', onThreadsReceived);
      reject('Socket request timed out');
    }, 3000); // Reduced timeout to 3 seconds for faster fallback
  });
};

export const getDirectMessages = (threadId, page = 1, perPage = 50) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot get messages: Socket not connected');
    return Promise.reject('Socket not connected');
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot get messages: User not authenticated');
    return Promise.reject('User not authenticated');
  }

  console.log(`Requesting direct messages for thread ${threadId}, page ${page}`);

  return new Promise((resolve, reject) => {
    // Create a one-time event listener for the response
    const onMessagesReceived = (data) => {
      if (data.thread_id === parseInt(threadId)) {
        console.log('Received messages in promise handler:', data);
        resolve(data);
        // Remove the listener to avoid memory leaks
        socket.off('direct_messages', onMessagesReceived);
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
      socket.off('direct_messages', onMessagesReceived);
      reject('Socket request timed out');
    }, 3000); // Reduced timeout to 3 seconds for faster fallback
  });
};

export const sendDirectMessage = (threadId, content, encryptedContent = null) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot send message: Socket not connected');
    return Promise.reject('Socket not connected');
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot send message: User not authenticated');
    return Promise.reject('User not authenticated');
  }

  console.log(`Sending message to thread ${threadId}`);

  return new Promise((resolve, reject) => {
    // Create a one-time event listener for the response
    const onMessageSent = (data) => {
      if (data.thread_id === parseInt(threadId)) {
        console.log('Message sent successfully:', data);
        resolve(data);
        // Remove the listener to avoid memory leaks
        socket.off('direct_message_sent', onMessageSent);
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
      // Remove the listener to avoid memory leaks
      socket.off('direct_message_sent', onMessageSent);
      reject('Socket request timed out');
    }, 3000); // Reduced timeout to 3 seconds for faster fallback
  });
};

export const markMessagesRead = (threadId) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot mark messages read: Socket not connected');
    return Promise.reject('Socket not connected');
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot mark messages read: User not authenticated');
    return Promise.reject('User not authenticated');
  }

  console.log(`Marking messages as read in thread ${threadId}`);

  return new Promise((resolve, reject) => {
    // Create a one-time event listener for the response
    const onMessagesMarkedRead = (data) => {
      if (data.thread_id === parseInt(threadId)) {
        console.log('Messages marked as read:', data);
        resolve(data);
        // Remove the listener to avoid memory leaks
        socket.off('messages_marked_read', onMessagesMarkedRead);
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
      // Remove the listener to avoid memory leaks
      socket.off('messages_marked_read', onMessagesMarkedRead);
      reject('Socket request timed out');
    }, 3000); // Reduced timeout to 3 seconds for faster fallback
  });
};

export const createDirectMessageThread = (userId, eventId = null) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot create thread: Socket not connected');
    return Promise.reject('Socket not connected');
  }

  // Check if user is authenticated using selector
  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot create thread: User not authenticated');
    return Promise.reject('User not authenticated');
  }

  console.log(`Creating direct message thread with user ${userId}`);

  return new Promise((resolve, reject) => {
    // Create a one-time event listener for the response
    const onThreadCreated = (data) => {
      if (data.other_user && data.other_user.id === parseInt(userId)) {
        console.log('Thread created successfully:', data);
        resolve(data);
        // Remove the listener to avoid memory leaks
        socket.off('direct_message_thread_created', onThreadCreated);
        clearTimeout(timeoutId);
      }
    };

    // Set up the listener before emitting
    socket.once('direct_message_thread_created', onThreadCreated);

    // Emit the request
    // Emit with optional event context for admin messaging
    const payload = { user_id: userId };
    if (eventId) {
      payload.event_id = eventId;
    }
    socket.emit('create_direct_message_thread', payload);

    // Add timeout for socket response
    const timeoutId = setTimeout(() => {
      console.warn('Socket request for creating thread timed out');
      // Remove the listener to avoid memory leaks
      socket.off('direct_message_thread_created', onThreadCreated);
      reject('Socket request timed out');
    }, 3000); // Reduced timeout to 3 seconds for faster fallback
  });
};

// Join user's room for receiving messages
export const joinUserRoom = (userId) => {
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

// ============================================
// CHAT ROOM EMITTERS
// ============================================

// Track active chat room subscription
let activeChatRoom = null;

// Join a specific chat room for direct updates
export const joinChatRoom = async (roomId) => {
  console.log(`🟢 joinChatRoom called for room ${roomId}`);

  // Wait for socket connection first
  const connectedSocket = await waitForSocket();

  if (!connectedSocket || !connectedSocket.connected) {
    console.warn('Cannot join chat room: Socket not connected after waiting');
    return Promise.reject('Socket not connected');
  }

  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot join chat room: User not authenticated');
    return Promise.reject('User not authenticated');
  }

  console.log(`🟢 JOINING chat room ${roomId}`);

  return new Promise((resolve) => {
    // Set up one-time listener for join confirmation
    const onJoined = (data) => {
      if (data.room_id === parseInt(roomId)) {
        console.log(`🟢 CONFIRMED join for room ${roomId}:`, data);
        connectedSocket.off('chat_room_joined', onJoined);
        clearTimeout(timeoutId);
        resolve(data);
      }
    };

    connectedSocket.once('chat_room_joined', onJoined);

    // Emit the join request
    connectedSocket.emit('join_chat_room', { room_id: parseInt(roomId) });
    console.log(`🟢 EMITTED join_chat_room for room ${roomId}`);

    // Fallback timeout in case no confirmation
    const timeoutId = setTimeout(() => {
      console.log(`🟢 TIMEOUT: Assuming join succeeded for room ${roomId}`);
      connectedSocket.off('chat_room_joined', onJoined);
      resolve({ room_id: roomId });
    }, 1000);
  });
};

// Leave a chat room
export const leaveChatRoom = (roomId) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot leave chat room: Socket not connected');
    return Promise.resolve(); // Return resolved promise for consistency
  }

  console.log(`🔴 LEAVING chat room ${roomId}`);

  return new Promise((resolve) => {
    // Set up one-time listener for leave confirmation
    const onLeft = (data) => {
      if (data.room_id === parseInt(roomId)) {
        console.log(`🔴 CONFIRMED leave for room ${roomId}:`, data);
        socket.off('chat_room_left', onLeft);
        clearTimeout(timeoutId);
        resolve(data);
      }
    };

    socket.once('chat_room_left', onLeft);

    // Emit the leave request
    socket.emit('leave_chat_room', { room_id: parseInt(roomId) });
    console.log(`🔴 EMITTED leave_chat_room for room ${roomId}`);

    // Fallback timeout in case no confirmation (shorter than join since leave is simpler)
    const timeoutId = setTimeout(() => {
      console.log(`🔴 TIMEOUT: Assuming leave succeeded for room ${roomId}`);
      socket.off('chat_room_left', onLeft);
      resolve({ room_id: roomId });
    }, 500); // 500ms timeout for leave operations
  });
};

// Smart room subscription - only subscribe to active room
export const setActiveChatRoom = async (roomId) => {
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
export const getActiveChatRoom = () => activeChatRoom;

// Send message to chat room (via Socket.IO)
export const sendChatMessage = (roomId, content) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot send chat message: Socket not connected');
    return Promise.reject('Socket not connected');
  }

  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot send chat message: User not authenticated');
    return Promise.reject('User not authenticated');
  }

  console.log(`Sending message to chat room ${roomId}`);

  return new Promise((resolve, reject) => {
    const onMessageSent = (data) => {
      if (data.room_id === parseInt(roomId)) {
        console.log('Chat message sent successfully:', data);
        resolve(data);
        socket.off('chat_message_sent', onMessageSent);
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
      socket.off('chat_message_sent', onMessageSent);
      reject('Socket request timed out');
    }, 5000);
  });
};

// Get list of chat rooms (one-time fetch)
export const getChatRooms = (eventId) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot get chat rooms: Socket not connected');
    return Promise.reject('Socket not connected');
  }

  const state = store.getState();
  const isAuthenticated = selectIsAuthenticated(state);

  if (!isAuthenticated) {
    console.warn('Cannot get chat rooms: User not authenticated');
    return Promise.reject('User not authenticated');
  }

  console.log(`Requesting chat rooms for event ${eventId}`);

  return new Promise((resolve, reject) => {
    const onRoomsReceived = (data) => {
      console.log('Received chat rooms:', data);
      resolve(data);
      socket.off('chat_rooms', onRoomsReceived);
      clearTimeout(timeoutId);
    };

    socket.once('chat_rooms', onRoomsReceived);
    socket.emit('get_chat_rooms', { event_id: eventId });

    const timeoutId = setTimeout(() => {
      console.warn('Socket request for chat rooms timed out');
      socket.off('chat_rooms', onRoomsReceived);
      reject('Socket request timed out');
    }, 10000);
  });
};

// Join event for general notifications
export const joinEventNotifications = (eventId) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot join event: Socket not connected');
    return;
  }

  console.log(`Joining event ${eventId} for notifications`);
  socket.emit('join_event', { event_id: eventId });
};

// Leave event notifications
export const leaveEventNotifications = (eventId) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot leave event: Socket not connected');
    return;
  }

  console.log(`Leaving event ${eventId} notifications`);
  socket.emit('leave_event', { event_id: eventId });
};

// Join event admin monitoring room
export const joinEventAdmin = (eventId) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot join event admin: Socket not connected');
    return;
  }

  console.log(`🔧 Joining event ${eventId} admin monitoring`);
  socket.emit('join_event_admin', { event_id: eventId });
};

// ============================================
// SESSION CHAT ROOM EMITTERS
// ============================================

// Join all chat rooms for a session
export const joinSessionChatRooms = (sessionId) => {
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
  socket.emit('join_session_chat_rooms', { session_id: sessionId });
};

// Leave all chat rooms for a session
export const leaveSessionChatRooms = (sessionId) => {
  if (!socket || !socket.connected) {
    console.warn('Cannot leave session chat rooms: Socket not connected');
    return;
  }

  console.log(`Leaving chat rooms for session ${sessionId}`);
  socket.emit('leave_session_chat_rooms', { session_id: sessionId });
};
