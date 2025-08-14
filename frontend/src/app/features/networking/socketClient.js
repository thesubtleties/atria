// src/app/features/networking/socketClient.js
import { io } from 'socket.io-client';
import { store } from '../../store';
import { networkingApi } from './api';
import { chatApi } from '../chat/api';
import { selectUser, selectIsAuthenticated } from '../../store/authSlice';

let socket = null;
let connectionPromise = null;
let isConnecting = false;
let messageCallbacks = new Map(); // Map of roomId -> callback function

export const initializeSocket = (token = null) => {
  if (socket && socket.connected) {
    console.log('🔌 Socket already exists and connected, returning existing socket');
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
    // Update RTK Query cache
    if (data && data.threads) {
      store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessageThreads',
          undefined,
          () => {
            return data.threads;
          }
        )
      );
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
          }
        )
      );
    }
  });

  socket.on('new_direct_message', (data) => {
    console.log('🔵 Received new direct message:', data);
    console.log('🔵 Thread ID:', data.thread_id, 'Type:', typeof data.thread_id);

    if (data && data.thread_id) {
      // Update thread list to show latest message
      console.log('🔵 Updating thread list...');
      store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessageThreads',
          undefined,
          (draft) => {
            if (!Array.isArray(draft)) return draft;

            const threadIndex = draft.findIndex((t) => t.id === data.thread_id);
            if (threadIndex >= 0) {
              draft[threadIndex].last_message = data;
              draft[threadIndex].last_message_at = data.created_at;

              // Move this thread to the top
              const thread = draft[threadIndex];
              draft.splice(threadIndex, 1);
              draft.unshift(thread);
              console.log('🔵 Thread list updated successfully');
            }
            return draft;
          }
        )
      );

      // Add message to the thread messages
      // Try to update page 1 (most recent messages)
      console.log('🔵 Updating messages for threadId:', data.thread_id);
      
      // First try to update page 1
      const updateResult = store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessages',
          { threadId: data.thread_id, page: 1 },
          (draft) => {
            console.log('🔵 Current draft for page 1:', draft);
            if (!draft || !draft.messages) {
              console.log('🔵 No draft or messages array found for page 1');
              return draft;
            }

            // Check if message already exists
            const messageExists = draft.messages.some((m) => m.id === data.id);
            if (!messageExists) {
              draft.messages.push(data);
              console.log('🔵 Message added to cache, new count:', draft.messages.length);
            } else {
              console.log('🔵 Message already exists, skipping');
            }
            return draft;
          }
        )
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
              if (!draft || !draft.messages) return draft;
              
              const messageExists = draft.messages.some((m) => m.id === data.id);
              if (!messageExists) {
                draft.messages.push(data);
              }
              return draft;
            }
          )
        );
      }
    }
  });

  socket.on('messages_read', (data) => {
    console.log('Messages read notification:', data);

    if (data && data.thread_id) {
      // Update message status
      store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessages',
          { threadId: data.thread_id },
          (draft) => {
            if (!draft || !draft.messages) return draft;

            draft.messages.forEach((msg) => {
              if (msg.sender_id !== data.reader_id) {
                msg.status = 'READ';
              }
            });
            return draft;
          }
        )
      );
    }
  });

  socket.on('direct_message_thread_created', (data) => {
    console.log('New thread created:', data);

    if (data) {
      // Add to thread list
      store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessageThreads',
          undefined,
          (draft) => {
            if (!Array.isArray(draft)) return draft;

            const exists = draft.some((t) => t.id === data.id);
            if (!exists) {
              draft.unshift(data);
            }
            return draft;
          }
        )
      );
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
          deleted_at: new Date().toISOString()
        });
      }
      
      // Also update the RTK Query cache for backwards compatibility
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: roomId, limit: 100, offset: 0 },
          (draft) => {
            if (draft?.messages) {
              const messageIndex = draft.messages.findIndex(m => m.id === messageId);
              if (messageIndex >= 0) {
                // Update the message to show as deleted with moderator info
                draft.messages[messageIndex] = {
                  ...draft.messages[messageIndex],
                  is_deleted: true,
                  deleted_at: new Date().toISOString(),
                  deleted_by: data.deleted_by
                };
              }
            }
          }
        )
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
          messageId
        });
      }
      
      // Remove the message from the cache entirely
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRoomMessages',
          { chatRoomId: roomId, limit: 100, offset: 0 },
          (draft) => {
            if (draft?.messages) {
              draft.messages = draft.messages.filter(m => m.id !== messageId);
            }
          }
        )
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
          message: data
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
          (draft) => {
            console.log('🔵 Updating cache for key:', cacheKey);
            console.log('🔵 Current draft:', draft);
            
            if (!draft) {
              console.log('🔵 No draft found - query might not be active');
              return draft;
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
            
            return draft;
          }
        )
      );
      
      console.log('🔵 Update result:', updateResult);
      
      // If the cache update failed (no active query), we might need to let the user know
      if (!updateResult.data) {
        console.log('🔵 ⚠️ Cache update failed - no active query for this room');
        // Only invalidate if we couldn't update the cache
        store.dispatch(
          chatApi.util.invalidateTags([{ type: 'ChatMessage', id: roomId }])
        );
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
        chatApi.util.updateQueryData(
          'getChatRooms',
          data.event_id,
          (draft) => {
            if (!draft || !draft.chat_rooms) return draft;
            
            const room = draft.chat_rooms.find(r => r.id === data.room_id);
            if (room) {
              room.unread_count = data.unread_count;
              room.latest_message = data.latest_message;
              room.updated_at = data.updated_at;
            }
            return draft;
          }
        )
      );
    }
  });

  socket.on('chat_room_created', (data) => {
    console.log('New chat room created:', data);
    
    // Invalidate chat rooms list
    if (data && data.event_id) {
      store.dispatch(
        chatApi.util.invalidateTags([
          { type: 'ChatRoom', id: 'LIST' }
        ])
      );
    }
  });

  socket.on('chat_room_updated', (data) => {
    console.log('Chat room updated:', data);
    
    // Update specific room
    if (data && data.room_id) {
      store.dispatch(
        chatApi.util.updateQueryData(
          'getChatRooms',
          data.event_id,
          (draft) => {
            if (!draft || !draft.chat_rooms) return draft;
            
            const room = draft.chat_rooms.find(r => r.id === data.room_id);
            if (room && data.updates) {
              Object.assign(room, data.updates);
            }
            return draft;
          }
        )
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
            if (!draft) return draft;
            // Store user count in the response
            draft.active_users = data.user_count;
            return draft;
          }
        )
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
            if (!draft) return draft;
            draft.active_users = (draft.active_users || 0) + 1;
            return draft;
          }
        )
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
            if (!draft) return draft;
            draft.active_users = Math.max(0, (draft.active_users || 1) - 1);
            return draft;
          }
        )
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
            if (!draft) return { messages: data.messages };
            draft.messages = data.messages;
            return draft;
          }
        )
      );
    }
  });

  socket.on('chat_room_left', (data) => {
    console.log('Left chat room:', data);
  });

  return socket;
};

export const getSocket = () => {
  console.log('🔌 getSocket called, socket is:', socket ? 'EXISTS' : 'NULL', 'connected:', socket?.connected);
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
    }, 10000); // Increased timeout to 10 seconds
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

  console.log(
    `Requesting direct messages for thread ${threadId}, page ${page}`
  );

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
    }, 10000); // Increased timeout to 10 seconds
  });
};

export const sendDirectMessage = (
  threadId,
  content,
  encryptedContent = null
) => {
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
    }, 10000); // Increased timeout to 10 seconds
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
    }, 10000); // Increased timeout to 10 seconds
  });
};

export const createDirectMessageThread = (userId) => {
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
    socket.emit('create_direct_message_thread', { user_id: userId });

    // Add timeout for socket response
    const timeoutId = setTimeout(() => {
      console.warn('Socket request for creating thread timed out');
      // Remove the listener to avoid memory leaks
      socket.off('direct_message_thread_created', onThreadCreated);
      reject('Socket request timed out');
    }, 10000); // Increased timeout to 10 seconds
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
    return;
  }

  console.log(`🔴 LEAVING chat room ${roomId}`);
  socket.emit('leave_chat_room', { room_id: parseInt(roomId) });
};

// Smart room subscription - only subscribe to active room
export const setActiveChatRoom = async (roomId) => {
  console.log(`🎯 setActiveChatRoom called with roomId: ${roomId}`);
  
  // Leave previous room if different
  if (activeChatRoom && activeChatRoom !== roomId) {
    leaveChatRoom(activeChatRoom);
  }

  // Join new room
  if (roomId) {
    try {
      await joinChatRoom(roomId);
      activeChatRoom = roomId;
      console.log(`✅ Active chat room set to ${roomId}`);
    } catch (error) {
      console.error('❌ Failed to join chat room:', error);
    }
  } else {
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
      content: content.trim()
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
