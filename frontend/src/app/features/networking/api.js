// src/app/features/networking/api.js
import { baseApi } from '../api';
import {
  getSocket,
  getDirectMessageThreads,
  getDirectMessages,
  sendDirectMessage,
  createDirectMessageThread,
  markMessagesRead,
} from './socketClient';

// Helper function to handle socket promises with RTK Query
const socketBaseQuery = () => async (args) => {
  const { url, method, body } = args;

  try {
    let result;

    switch (url) {
      case 'direct-message-threads':
        result = await getDirectMessageThreads();
        return { data: result };

      case 'direct-messages':
        result = await getDirectMessages(
          body.threadId,
          body.page || 1,
          body.perPage || 50
        );
        return { data: result };

      case 'send-message':
        result = await sendDirectMessage(
          body.threadId,
          body.content,
          body.encryptedContent
        );
        return { data: result };

      case 'create-thread':
        result = await createDirectMessageThread(body.userId, body.eventId);
        return { data: result };

      case 'mark-read':
        result = await markMessagesRead(body.threadId);
        return { data: result };

      default:
        return { error: { message: 'Unknown socket endpoint' } };
    }
  } catch (error) {
    return { error: { message: error.toString() } };
  }
};

// Fallback to HTTP if socket fails
const queryWithFallback = async (args, api, extraOptions) => {
  try {
    // Try socket first
    const socket = getSocket();
    if (socket && socket.connected) {
      try {
        const socketResult = await socketBaseQuery()(args, api, extraOptions);
        if (!socketResult.error) return socketResult;
      } catch (socketError) {
        console.log('Socket query failed:', socketError);
      }
    }

    // Fall back to HTTP - use the baseApi's baseQuery
    console.log('Socket unavailable or failed, falling back to HTTP');

    // Map socket-style endpoints to HTTP endpoints
    let httpArgs = { ...args };

    // Transform socket endpoints to HTTP endpoints
    if (args.url === 'direct-message-threads') {
      httpArgs.url = '/direct-messages/threads';
    } else if (args.url === 'direct-messages') {
      httpArgs.url = `/direct-messages/threads/${args.body.threadId}/messages`;
      httpArgs.params = {
        page: args.body.page || 1,
        per_page: args.body.perPage || 50,
      };
      delete httpArgs.body;
    } else if (args.url === 'send-message') {
      httpArgs.url = `/direct-messages/threads/${args.body.threadId}/messages`;
      httpArgs.body = {
        content: args.body.content,
        encrypted_content: args.body.encryptedContent,
      };
      delete httpArgs.body.threadId;
      delete httpArgs.body.encryptedContent;
    } else if (args.url === 'create-thread') {
      httpArgs.url = '/direct-messages/threads';
      httpArgs.body = { user_id: args.body.userId };
      // Include eventId if provided for admin messaging
      if (args.body.eventId) {
        httpArgs.body.event_id = args.body.eventId;
      }
      delete httpArgs.body.userId;
      delete httpArgs.body.eventId;
    } else if (args.url === 'mark-read') {
      httpArgs.url = `/direct-messages/threads/${args.body.threadId}/read`;
      httpArgs.method = 'POST';
      delete httpArgs.body;
    }

    // Use the original baseQuery from baseApi
    return api.dispatch(
      baseApi.endpoints.customQuery.initiate(httpArgs, extraOptions)
    );
  } catch (error) {
    return { error: { message: error.toString() } };
  }
};

// Add a custom query endpoint to baseApi if it doesn't exist
if (!baseApi.endpoints.customQuery) {
  baseApi.injectEndpoints({
    endpoints: (build) => ({
      customQuery: build.query({
        query: (args) => args,
      }),
    }),
    overrideExisting: false,
  });
}

// Inject networking endpoints into baseApi
export const networkingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all direct message threads
    // Socket: get_direct_message_threads -> direct_message_threads response
    // HTTP: GET /direct-messages/threads
    getDirectMessageThreads: builder.query({
      queryFn: async (arg, api, extraOptions) => {
        // arg can be undefined or an object with eventId
        const eventId = arg?.eventId;
        return queryWithFallback(
          {
            url: 'direct-message-threads',
            method: 'GET',
            params: eventId ? { event_id: eventId } : undefined,
          },
          api,
          extraOptions
        );
      },
      transformResponse: (response) => {
        // Handle both socket and HTTP responses
        if (response.threads) {
          return response.threads;
        } else if (response.data && response.data.threads) {
          return response.data.threads;
        }
        return response;
      },
      providesTags: ['Thread'],
    }),

    // Get messages for a thread with pagination
    // Socket: get_direct_messages -> direct_messages response
    // HTTP: GET /direct-messages/threads/:threadId/messages?page=X&per_page=Y
    getDirectMessages: builder.query({
      queryFn: async (arg, api, extraOptions) => {
        return queryWithFallback(
          {
            url: 'direct-messages',
            method: 'GET',
            body: arg,
          },
          api,
          extraOptions
        );
      },
      transformResponse: (response) => {
        // Handle both socket and HTTP responses
        const result = {
          messages: [],
          pagination: null,
          thread_id: null,
          other_user: null,
          is_encrypted: false,
        };
        // normalization of the response whether it comes from socket or HTTP
        if (response.messages) {
          // Socket response
          result.messages = response.messages;
          result.pagination = response.pagination;
          result.thread_id = response.thread_id;
          result.other_user = response.other_user;
          result.is_encrypted = response.is_encrypted;
        } else if (response.data) {
          // HTTP response
          result.messages = response.data.messages || [];
          result.pagination = response.data.pagination;
          result.thread_id = response.data.thread_id;
          result.other_user = response.data.other_user;
          result.is_encrypted = response.data.is_encrypted;
        }

        return result;
      },
      providesTags: (result, error, { threadId }) => [
        { type: 'DirectMessage', id: threadId },
      ],
    }),

    // Send a direct message
    // Socket: send_direct_message -> direct_message_sent response
    // HTTP: POST /direct-messages/threads/:threadId/messages
    sendDirectMessage: builder.mutation({
      queryFn: async (arg, api, extraOptions) => {
        return queryWithFallback(
          {
            url: 'send-message',
            method: 'POST',
            body: arg,
          },
          api,
          extraOptions
        );
      },
      // Don't invalidate - we handle updates via optimistic updates and socket callbacks
      // invalidatesTags: (result, error, { threadId }) => [
      //   { type: 'DirectMessage', id: threadId },
      // ],
    }),

    // Create a new thread
    // Socket: create_direct_message_thread -> direct_message_thread_created response
    // HTTP: POST /direct-messages/threads
    createDirectMessageThread: builder.mutation({
      queryFn: async (arg, api, extraOptions) => {
        // Support both old format (just userId) and new format (object with userId and eventId)
        const body = typeof arg === 'object' ? arg : { userId: arg };
        return queryWithFallback(
          {
            url: 'create-thread',
            method: 'POST',
            body,
          },
          api,
          extraOptions
        );
      },
      invalidatesTags: ['Thread'],
    }),

    // Mark messages as read
    // Socket: mark_messages_read -> messages_marked_read response
    // HTTP: POST /direct-messages/threads/:threadId/read
    markMessagesRead: builder.mutation({
      queryFn: async (arg, api, extraOptions) => {
        return queryWithFallback(
          {
            url: 'mark-read',
            method: 'POST',
            body: { threadId: arg },
          },
          api,
          extraOptions
        );
      },
      // Don't invalidate - read status updates are handled via socket events
      // The 'messages_read' socket event updates message statuses locally
      // No need to refetch all messages just for read status changes
    }),
    // Connection endpoints
    // Create connection request
    // HTTP only: POST /connections
    createConnection: builder.mutation({
      query: ({ recipientId, icebreakerMessage, originatingEventId }) => ({
        url: '/connections',
        method: 'POST',
        body: {
          recipient_id: recipientId,
          icebreaker_message: icebreakerMessage,
          originating_event_id: originatingEventId,
        },
      }),
      invalidatesTags: ['Connection', 'EventUsers'],
    }),

    // Get user connections
    // HTTP only: GET /connections?status=X&page=Y&per_page=Z
    getConnections: builder.query({
      query: ({ status, page = 1, perPage = 50 }) => ({
        url: '/connections',
        params: {
          status,
          page,
          per_page: perPage,
        },
      }),
      providesTags: ['Connection'],
    }),

    // Update connection status (accept/reject)
    // HTTP only: PUT /connections/:connectionId
    updateConnectionStatus: builder.mutation({
      query: ({ connectionId, status }) => ({
        url: `/connections/${connectionId}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Connection', 'Thread', 'EventUsers'],
    }),

    // Remove connection (soft delete)
    // HTTP only: DELETE /connections/:connectionId
    removeConnection: builder.mutation({
      query: (connectionId) => ({
        url: `/connections/${connectionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Connection', 'Thread', 'EventUsers'],
      // Handle 204 No Content response
      transformResponse: (response) => response || { success: true },
    }),

    // Get connections within an event
    // HTTP only: GET /events/:eventId/connections?page=Y&per_page=Z
    getEventConnections: builder.query({
      query: ({ eventId, page = 1, perPage = 50 }) => ({
        url: `/events/${eventId}/connections`,
        params: {
          page,
          per_page: perPage,
        },
      }),
      providesTags: ['Connection'],
    }),

    // Get pending connection requests
    // HTTP only: GET /connections/pending?page=Y&per_page=Z
    getPendingConnections: builder.query({
      query: ({ page = 1, perPage = 50 }) => ({
        url: '/connections/pending',
        params: {
          page,
          per_page: perPage,
        },
      }),
      providesTags: ['Connection'],
    }),

    // Clear/hide a direct message thread
    // HTTP only: DELETE /direct-messages/threads/:threadId/clear
    clearThread: builder.mutation({
      query: (threadId) => ({
        url: `/direct-messages/threads/${threadId}/clear`,
        method: 'DELETE',
      }),
      // Optimistically remove thread from cache
      onQueryStarted: async (threadId, { dispatch, queryFulfilled }) => {
        // Update the threads list to remove the cleared thread
        const patchResult = dispatch(
          networkingApi.util.updateQueryData('getDirectMessageThreads', undefined, (draft) => {
            return draft.filter(thread => thread.id !== threadId);
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          // Revert optimistic update on error
          patchResult.undo();
        }
      },
      invalidatesTags: ['Thread'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDirectMessageThreadsQuery,
  useGetDirectMessagesQuery,
  useSendDirectMessageMutation,
  useCreateDirectMessageThreadMutation,
  useMarkMessagesReadMutation,
  useCreateConnectionMutation,
  useGetConnectionsQuery,
  useUpdateConnectionStatusMutation,
  useRemoveConnectionMutation,
  useGetEventConnectionsQuery,
  useGetPendingConnectionsQuery,
  useClearThreadMutation,
} = networkingApi;
