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
        result = await createDirectMessageThread(body.userId);
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
      delete httpArgs.body.userId;
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
    getDirectMessageThreads: builder.query({
      queryFn: async (arg, api, extraOptions) => {
        return queryWithFallback(
          {
            url: 'direct-message-threads',
            method: 'GET',
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

        if (response.messages) {
          result.messages = response.messages;
          result.pagination = response.pagination;
          result.thread_id = response.thread_id;
          result.other_user = response.other_user;
          result.is_encrypted = response.is_encrypted;
        } else if (response.data) {
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
      invalidatesTags: (result, error, { threadId }) => [
        { type: 'DirectMessage', id: threadId },
      ],
    }),

    // Create a new thread
    createDirectMessageThread: builder.mutation({
      queryFn: async (arg, api, extraOptions) => {
        return queryWithFallback(
          {
            url: 'create-thread',
            method: 'POST',
            body: { userId: arg },
          },
          api,
          extraOptions
        );
      },
      invalidatesTags: ['Thread'],
    }),

    // Mark messages as read
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
      invalidatesTags: (result, error, threadId) => [
        { type: 'DirectMessage', id: threadId },
      ],
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
} = networkingApi;
