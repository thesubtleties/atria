// src/app/features/networking/socketClient.js
import { io } from 'socket.io-client';
import { store } from '../../store';
import { networkingApi } from './api';
import { selectUser, selectIsAuthenticated } from '../../store/authSlice';

let socket = null;

export const initializeSocket = (token) => {
  if (socket) return socket;

  console.log('Initializing socket with token');

  // Create socket connection with auth header
  console.log('Initializing socket with token');

  // Connect using the proxy
  socket = io({
    path: '/socket.io', // Make sure this matches your backend
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
    // auth: { token },
    // autoConnect: true,
    // transports: ['websocket', 'polling'], // Try websocket first, then polling
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
    console.log('Socket connected with ID:', socket.id);

    // Get user ID from store using selector
    const state = store.getState();
    const user = selectUser(state);

    if (user && user.id) {
      joinUserRoom(user.id);
    }

    // Fetch initial data
    fetchInitialData();
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
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
    console.log('Received new direct message:', data);

    if (data && data.thread_id) {
      // Update thread list to show latest message
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
            }
            return draft;
          }
        )
      );

      // Add message to the thread messages
      store.dispatch(
        networkingApi.util.updateQueryData(
          'getDirectMessages',
          { threadId: data.thread_id },
          (draft) => {
            if (!draft || !draft.messages) return draft;

            // Check if message already exists
            const messageExists = draft.messages.some((m) => m.id === data.id);
            if (!messageExists) {
              draft.messages.push(data);
            }
            return draft;
          }
        )
      );
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

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
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
