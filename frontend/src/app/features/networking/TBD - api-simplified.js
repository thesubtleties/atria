// Simplified version with resilient fallback pattern
// While needing testing, this is the same pattern used in the original code but with a more verbose approach for clarity
// REMOVE THIS COMMENT IF YOU IMPLEMENT THIS CODE
import { baseApi } from '../api';
import {
  getSocket,
  getDirectMessageThreads,
  getDirectMessages,
  sendDirectMessage,
  createDirectMessageThread,
  markMessagesRead,
} from './socketClient';

// Helper to normalize responses from either transport
const normalizeThreadsResponse = (response) => {
  // Socket response has threads directly
  if (response.threads) return response.threads;
  // HTTP response wraps in data
  if (response.data?.threads) return response.data.threads;
  return response;
};

const normalizeMessagesResponse = (response) => {
  const result = {
    messages: [],
    pagination: null,
    thread_id: null,
    other_user: null,
    is_encrypted: false,
  };

  if (response.messages) {
    // Socket response
    Object.assign(result, response);
  } else if (response.data) {
    // HTTP response
    result.messages = response.data.messages || [];
    result.pagination = response.data.pagination;
    result.thread_id = response.data.thread_id;
    result.other_user = response.data.other_user;
    result.is_encrypted = response.data.is_encrypted;
  }

  return result;
};

// Inject networking endpoints into baseApi
export const networkingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all direct message threads
    getDirectMessageThreads: builder.query({
      queryFn: async (arg, api) => {
        const socket = getSocket();

        // Try socket first if available
        if (socket?.connected) {
          try {
            const result = await getDirectMessageThreads();
            return { data: normalizeThreadsResponse(result) };
          } catch (error) {
            console.log('Socket failed, falling back to HTTP:', error);
          }
        }

        // HTTP fallback
        try {
          // Use the baseApi's built-in fetch
          const result = await api
            .dispatch(
              baseApi.endpoints.internalQuery.initiate({
                url: '/direct-messages/threads',
                method: 'GET',
              })
            )
            .unwrap();

          return { data: normalizeThreadsResponse(result) };
        } catch (error) {
          return { error: { status: error.status, data: error.data } };
        }
      },
      providesTags: ['Thread'],
    }),

    // Get messages for a thread with pagination
    getDirectMessages: builder.query({
      queryFn: async ({ threadId, page = 1, perPage = 50 }, api) => {
        const socket = getSocket();

        // Try socket first if available
        if (socket?.connected) {
          try {
            const result = await getDirectMessages(threadId, page, perPage);
            return { data: normalizeMessagesResponse(result) };
          } catch (error) {
            console.log('Socket failed, falling back to HTTP:', error);
          }
        }

        // HTTP fallback
        try {
          const result = await api
            .dispatch(
              baseApi.endpoints.internalQuery.initiate({
                url: `/direct-messages/threads/${threadId}/messages`,
                method: 'GET',
                params: {
                  page,
                  per_page: perPage,
                },
              })
            )
            .unwrap();

          return { data: normalizeMessagesResponse(result) };
        } catch (error) {
          return { error: { status: error.status, data: error.data } };
        }
      },
      providesTags: (result, error, { threadId }) => [
        { type: 'DirectMessage', id: threadId },
      ],
    }),

    // Send a direct message
    sendDirectMessage: builder.mutation({
      queryFn: async ({ threadId, content, encryptedContent }, api) => {
        const socket = getSocket();

        // Try socket first if available
        if (socket?.connected) {
          try {
            const result = await sendDirectMessage(
              threadId,
              content,
              encryptedContent
            );
            return { data: result };
          } catch (error) {
            console.log('Socket failed, falling back to HTTP:', error);
          }
        }

        // HTTP fallback
        try {
          const result = await api
            .dispatch(
              baseApi.endpoints.internalMutation.initiate({
                url: `/direct-messages/threads/${threadId}/messages`,
                method: 'POST',
                body: {
                  content,
                  encrypted_content: encryptedContent,
                },
              })
            )
            .unwrap();

          return { data: result.data };
        } catch (error) {
          return { error: { status: error.status, data: error.data } };
        }
      },
      invalidatesTags: (result, error, { threadId }) => [
        { type: 'DirectMessage', id: threadId },
      ],
    }),

    // Create a new thread
    createDirectMessageThread: builder.mutation({
      queryFn: async (userId, api) => {
        const socket = getSocket();

        // Try socket first if available
        if (socket?.connected) {
          try {
            const result = await createDirectMessageThread(userId);
            return { data: result };
          } catch (error) {
            console.log('Socket failed, falling back to HTTP:', error);
          }
        }

        // HTTP fallback
        try {
          const result = await api
            .dispatch(
              baseApi.endpoints.internalMutation.initiate({
                url: '/direct-messages/threads',
                method: 'POST',
                body: { user_id: userId },
              })
            )
            .unwrap();

          return { data: result.data };
        } catch (error) {
          return { error: { status: error.status, data: error.data } };
        }
      },
      invalidatesTags: ['Thread'],
    }),

    // Mark messages as read
    markMessagesRead: builder.mutation({
      queryFn: async (threadId, api) => {
        const socket = getSocket();

        // Try socket first if available
        if (socket?.connected) {
          try {
            const result = await markMessagesRead(threadId);
            return { data: result };
          } catch (error) {
            console.log('Socket failed, falling back to HTTP:', error);
          }
        }

        // HTTP fallback
        try {
          const result = await api
            .dispatch(
              baseApi.endpoints.internalMutation.initiate({
                url: `/direct-messages/threads/${threadId}/read`,
                method: 'POST',
              })
            )
            .unwrap();

          return { data: result.data };
        } catch (error) {
          return { error: { status: error.status, data: error.data } };
        }
      },
      invalidatesTags: (result, error, threadId) => [
        { type: 'DirectMessage', id: threadId },
      ],
    }),

    // Connection endpoints (HTTP only - no socket implementation)
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
      invalidatesTags: ['Connection'],
    }),

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

    updateConnectionStatus: builder.mutation({
      query: ({ connectionId, status }) => ({
        url: `/connections/${connectionId}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Connection', 'Thread'],
    }),

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
  }),
  overrideExisting: false,
});

// Add internal endpoints for HTTP fallback
if (!baseApi.endpoints.internalQuery) {
  baseApi.injectEndpoints({
    endpoints: (build) => ({
      internalQuery: build.query({
        query: (args) => args,
      }),
      internalMutation: build.mutation({
        query: (args) => args,
      }),
    }),
    overrideExisting: false,
  });
}

export const {
  useGetDirectMessageThreadsQuery,
  useGetDirectMessagesQuery,
  useSendDirectMessageMutation,
  useCreateDirectMessageThreadMutation,
  useMarkMessagesReadMutation,
  useCreateConnectionMutation,
  useGetConnectionsQuery,
  useUpdateConnectionStatusMutation,
  useGetEventConnectionsQuery,
  useGetPendingConnectionsQuery,
} = networkingApi;
