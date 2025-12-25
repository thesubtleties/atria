import type { Draft } from 'immer';
import { baseApi } from '../api';
import type { BaseQueryError } from '../api/baseQuery';
import type { DirectMessagesPayload, DirectMessageThreadsPayload } from './socketTypes';
import type {
  DirectMessage,
  DirectMessageThread,
  Connection,
  ConnectionCreateData,
  ConnectionUpdateData,
} from '@/types/networking';
import {
  getSocket,
  getDirectMessageThreads,
  getDirectMessages,
  sendDirectMessage,
  createDirectMessageThread,
  markMessagesRead,
} from './socketClient';
import type { PaginatedResponse } from '@/types/api';
import { hasProperty } from '@/types/utils';
import { isApiError, getErrorMessage } from '@/types/api';

// ─────────────────────────────────────────────────────────────────────────────
// Response Normalization Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Helper to normalize thread list responses from either transport */
const normalizeThreadsResponse = (response: unknown): DirectMessageThread[] => {
  // Socket response has threads directly
  if (hasProperty(response, 'threads') && Array.isArray(response.threads)) {
    return response.threads as DirectMessageThread[];
  }
  // HTTP response wraps in data
  if (hasProperty(response, 'data')) {
    const data = response.data;
    if (hasProperty(data, 'threads') && Array.isArray(data.threads)) {
      return (data as DirectMessageThreadsPayload).threads;
    }
  }
  // Already an array (legacy/socket format)
  if (Array.isArray(response)) {
    return response as DirectMessageThread[];
  }
  // Unexpected format
  console.warn('Unexpected thread list format:', response);
  return [];
};

/** Helper to normalize message responses from either transport */
const normalizeMessagesResponse = (response: unknown): DirectMessagesPayload => {
  const result: DirectMessagesPayload = {
    messages: [],
    pagination: null,
    thread_id: 0,
    other_user: null,
    is_encrypted: false,
  };

  // Socket response has messages directly
  if (hasProperty(response, 'messages')) {
    const socketResponse = response as DirectMessagesPayload;
    result.messages = socketResponse.messages;
    result.pagination = socketResponse.pagination;
    result.thread_id = socketResponse.thread_id;
    result.other_user = socketResponse.other_user;
    result.is_encrypted = socketResponse.is_encrypted;
  } else if (hasProperty(response, 'data')) {
    // HTTP response wraps in data
    const httpResponse = response as { data: DirectMessagesPayload };
    result.messages = httpResponse.data.messages || [];
    result.pagination = httpResponse.data.pagination;
    result.thread_id = httpResponse.data.thread_id;
    result.other_user = httpResponse.data.other_user;
    result.is_encrypted = httpResponse.data.is_encrypted;
  }

  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom Query Endpoint (for HTTP fallback)
// ─────────────────────────────────────────────────────────────────────────────

// Add a custom query endpoint to baseApi if it doesn't exist
if (!(baseApi.endpoints as { customQuery?: unknown }).customQuery) {
  baseApi.injectEndpoints({
    endpoints: (build) => ({
      customQuery: build.query<unknown, unknown>({
        query: (args: unknown) => {
          const baseQuery = args as {
            url: string;
            method?: string;
            body?: unknown;
            params?: Record<string, unknown>;
          };
          const result: {
            url: string;
            method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
            body?: unknown;
            params?: Record<string, unknown>;
          } = {
            url: baseQuery.url,
            method: (baseQuery.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') || 'GET',
          };
          if (baseQuery.body !== undefined) {
            result.body = baseQuery.body;
          }
          if (baseQuery.params !== undefined) {
            result.params = baseQuery.params;
          }
          return result;
        },
      }),
    }),
    overrideExisting: false,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/** Get direct message threads query argument */
type GetDirectMessageThreadsArg = { eventId?: number } | undefined;

/** Get direct messages query argument */
type GetDirectMessagesArg = {
  threadId: number;
  page?: number;
  perPage?: number;
};

/** Send direct message mutation argument */
type SendDirectMessageArg = {
  threadId: number;
  content: string;
  encryptedContent?: string;
};

/** Create direct message thread mutation argument (supports legacy number format) */
type CreateDirectMessageThreadArg = { userId: number; eventId?: number } | number;

/** Create connection mutation argument */
type CreateConnectionArg = ConnectionCreateData;

/** Get connections query argument */
type GetConnectionsArg = {
  status?: string;
  page?: number;
  perPage?: number;
};

/** Connections paginated response (backend returns 'connections' not 'items') */
type ConnectionsResponse = {
  connections: Connection[];
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
};

/** Update connection status mutation argument */
type UpdateConnectionStatusArg = {
  connectionId: number;
  status: ConnectionUpdateData['status'];
};

/** Get event connections query argument */
type GetEventConnectionsArg = {
  eventId: number;
  page?: number;
  perPage?: number;
};

/** Get pending connections query argument */
type GetPendingConnectionsArg = {
  page?: number;
  perPage?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Networking API Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const networkingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all direct message threads
    getDirectMessageThreads: builder.query<DirectMessageThread[], GetDirectMessageThreadsArg>({
      queryFn: async (arg, _api) => {
        const socket = getSocket();
        const eventId = arg?.eventId;

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
          const customQueryEndpoint = (
            baseApi.endpoints as {
              customQuery?: {
                initiate: (
                  args: unknown,
                  options?: unknown,
                ) => Promise<{ data: unknown } | { error: BaseQueryError }>;
              };
            }
          ).customQuery;
          if (!customQueryEndpoint) {
            return { error: { status: 500, message: 'Custom query endpoint not available' } };
          }

          const queryResult = await customQueryEndpoint.initiate(
            {
              url: '/direct-messages/threads',
              method: 'GET',
              ...(eventId ? { params: { event_id: eventId } } : {}),
            },
            {},
          );

          // RTK Query initiate returns a promise that resolves to { data } or { error }
          const result = await queryResult;
          if ('error' in result) {
            return result;
          }

          return { data: normalizeThreadsResponse(result.data) };
        } catch (error) {
          if (isApiError(error)) {
            return {
              error: {
                status: error.status ?? 500,
                data: error.data,
                message: getErrorMessage(error),
              },
            };
          }
          return { error: { status: 500, message: getErrorMessage(error) } };
        }
      },
      providesTags: ['Thread'],
    }),

    // Get messages for a thread with pagination
    getDirectMessages: builder.query<DirectMessagesPayload, GetDirectMessagesArg>({
      queryFn: async ({ threadId, page = 1, perPage = 50 }, _api) => {
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
          const customQueryEndpoint = (
            baseApi.endpoints as {
              customQuery?: {
                initiate: (
                  args: unknown,
                  options?: unknown,
                ) => Promise<{ data: unknown } | { error: BaseQueryError }>;
              };
            }
          ).customQuery;
          if (!customQueryEndpoint) {
            return { error: { status: 500, message: 'Custom query endpoint not available' } };
          }

          const queryResult = await customQueryEndpoint.initiate(
            {
              url: `/direct-messages/threads/${threadId}/messages`,
              method: 'GET',
              params: {
                page,
                per_page: perPage,
              },
            },
            {},
          );

          const result = await queryResult;
          if ('error' in result) {
            return result;
          }

          return { data: normalizeMessagesResponse(result.data) };
        } catch (error) {
          if (isApiError(error)) {
            return {
              error: {
                status: error.status ?? 500,
                data: error.data,
                message: getErrorMessage(error),
              },
            };
          }
          return { error: { status: 500, message: getErrorMessage(error) } };
        }
      },
      providesTags: (_result, _error, { threadId }) => [{ type: 'DirectMessage', id: threadId }],
    }),

    // Send a direct message
    sendDirectMessage: builder.mutation<DirectMessage, SendDirectMessageArg>({
      queryFn: async ({ threadId, content, encryptedContent }, _api) => {
        const socket = getSocket();

        // Try socket first if available
        if (socket?.connected) {
          try {
            const result = await sendDirectMessage(threadId, content, encryptedContent);
            return { data: result as DirectMessage };
          } catch (error) {
            console.log('Socket failed, falling back to HTTP:', error);
          }
        }

        // HTTP fallback
        try {
          const customQueryEndpoint = (
            baseApi.endpoints as {
              customQuery?: {
                initiate: (
                  args: unknown,
                  options?: unknown,
                ) => Promise<{ data: unknown } | { error: BaseQueryError }>;
              };
            }
          ).customQuery;
          if (!customQueryEndpoint) {
            return { error: { status: 500, message: 'Custom query endpoint not available' } };
          }

          const queryResult = await customQueryEndpoint.initiate(
            {
              url: `/direct-messages/threads/${threadId}/messages`,
              method: 'POST',
              body: {
                content,
                encrypted_content: encryptedContent,
              },
            },
            {},
          );

          const result = await queryResult;
          if ('error' in result) {
            return result;
          }

          return { data: result.data as DirectMessage };
        } catch (error) {
          if (isApiError(error)) {
            return {
              error: {
                status: error.status ?? 500,
                data: error.data,
                message: getErrorMessage(error),
              },
            };
          }
          return { error: { status: 500, message: getErrorMessage(error) } };
        }
      },
      // Don't invalidate - we handle updates via optimistic updates and socket callbacks
    }),

    // Create a new thread
    createDirectMessageThread: builder.mutation<DirectMessageThread, CreateDirectMessageThreadArg>({
      queryFn: async (arg, _api) => {
        const socket = getSocket();
        // Support both old format (just userId) and new format (object with userId and eventId)
        const body = typeof arg === 'object' ? arg : { userId: arg };
        const { userId, eventId } = body;

        // Try socket first if available
        if (socket?.connected) {
          try {
            const result = await createDirectMessageThread(userId, eventId ?? null);
            return { data: result as DirectMessageThread };
          } catch (error) {
            console.log('Socket failed, falling back to HTTP:', error);
          }
        }

        // HTTP fallback
        try {
          const customQueryEndpoint = (
            baseApi.endpoints as {
              customQuery?: {
                initiate: (
                  args: unknown,
                  options?: unknown,
                ) => Promise<{ data: unknown } | { error: BaseQueryError }>;
              };
            }
          ).customQuery;
          if (!customQueryEndpoint) {
            return { error: { status: 500, message: 'Custom query endpoint not available' } };
          }

          const httpBody: { user_id: number; event_id?: number } = { user_id: userId };
          if (eventId) {
            httpBody.event_id = eventId;
          }

          const queryResult = await customQueryEndpoint.initiate(
            {
              url: '/direct-messages/threads',
              method: 'POST',
              body: httpBody,
            },
            {},
          );

          const result = await queryResult;
          if ('error' in result) {
            return result;
          }

          return { data: result.data as DirectMessageThread };
        } catch (error) {
          if (isApiError(error)) {
            return {
              error: {
                status: error.status ?? 500,
                data: error.data,
                message: getErrorMessage(error),
              },
            };
          }
          return { error: { status: 500, message: getErrorMessage(error) } };
        }
      },
      invalidatesTags: ['Thread'],
    }),

    // Mark messages as read
    markMessagesRead: builder.mutation<{ thread_id: number }, number>({
      queryFn: async (threadId, _api) => {
        const socket = getSocket();

        // Try socket first if available
        if (socket?.connected) {
          try {
            const result = await markMessagesRead(threadId);
            return { data: result as { thread_id: number } };
          } catch (error) {
            console.log('Socket failed, falling back to HTTP:', error);
          }
        }

        // HTTP fallback
        try {
          const customQueryEndpoint = (
            baseApi.endpoints as {
              customQuery?: {
                initiate: (
                  args: unknown,
                  options?: unknown,
                ) => Promise<{ data: unknown } | { error: BaseQueryError }>;
              };
            }
          ).customQuery;
          if (!customQueryEndpoint) {
            return { error: { status: 500, message: 'Custom query endpoint not available' } };
          }

          const queryResult = await customQueryEndpoint.initiate(
            {
              url: `/direct-messages/threads/${threadId}/read`,
              method: 'POST',
            },
            {},
          );

          const result = await queryResult;
          if ('error' in result) {
            return result;
          }

          return { data: result.data as { thread_id: number } };
        } catch (error) {
          if (isApiError(error)) {
            return {
              error: {
                status: error.status ?? 500,
                data: error.data,
                message: getErrorMessage(error),
              },
            };
          }
          return { error: { status: 500, message: getErrorMessage(error) } };
        }
      },
      // Optimistically clear unread count when marking as read
      async onQueryStarted(threadId, { dispatch, queryFulfilled }) {
        // Update single cache (no eventId parameter)
        const patchResult = dispatch(
          networkingApi.util.updateQueryData(
            'getDirectMessageThreads',
            undefined, // Always undefined - single cache!
            (draft: Draft<DirectMessageThread[]>) => {
              // Cache should always be an array now
              if (!Array.isArray(draft)) return; // Early return - no modifications
              const threadIndex = draft.findIndex((t) => t.id === threadId);
              if (threadIndex >= 0 && draft[threadIndex]) {
                draft[threadIndex].unread_count = 0;
                console.log('✅ Cleared unread count for thread:', threadId);
              }
              // Immer handles returning the modified draft
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          // Rollback on error
          patchResult.undo();
        }
      },
    }),

    // Connection endpoints (HTTP only - no socket implementation)
    createConnection: builder.mutation<Connection, CreateConnectionArg>({
      query: (data) => ({
        url: '/connections',
        method: 'POST',
        body: {
          recipient_id: data.recipient_id,
          icebreaker_message: data.icebreaker_message,
          originating_event_id: data.originating_event_id,
        },
      }),
      invalidatesTags: ['Connection', 'EventUsers'],
    }),

    getConnections: builder.query<ConnectionsResponse, GetConnectionsArg>({
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

    updateConnectionStatus: builder.mutation<Connection, UpdateConnectionStatusArg>({
      query: ({ connectionId, status }) => ({
        url: `/connections/${connectionId}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Connection', 'Thread', 'EventUsers'],
    }),

    removeConnection: builder.mutation<void, number>({
      query: (connectionId) => ({
        url: `/connections/${connectionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Connection', 'Thread', 'EventUsers'],
    }),

    getEventConnections: builder.query<PaginatedResponse<Connection>, GetEventConnectionsArg>({
      query: ({ eventId, page = 1, perPage = 50 }) => ({
        url: `/events/${eventId}/connections`,
        params: {
          page,
          per_page: perPage,
        },
      }),
      providesTags: ['Connection'],
    }),

    getPendingConnections: builder.query<PaginatedResponse<Connection>, GetPendingConnectionsArg>({
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
    clearThread: builder.mutation<void, number>({
      query: (threadId) => ({
        url: `/direct-messages/threads/${threadId}/clear`,
        method: 'DELETE',
      }),
      // Optimistically remove thread from cache
      onQueryStarted: async (threadId, { dispatch, queryFulfilled }) => {
        // Update the threads list to remove the cleared thread
        const patchResult = dispatch(
          networkingApi.util.updateQueryData(
            'getDirectMessageThreads',
            undefined,
            (draft: Draft<DirectMessageThread[]>) => {
              // Cache should always be an array now
              if (!Array.isArray(draft)) return;

              // Find and remove the thread using in-place mutation
              const threadIndex = draft.findIndex((thread) => thread.id === threadId);
              if (threadIndex >= 0) {
                draft.splice(threadIndex, 1);
              }
              // Don't return anything - let Immer handle the modified draft
            },
          ),
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
