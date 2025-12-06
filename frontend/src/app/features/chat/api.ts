import { baseApi } from '../api';
import type {
  ChatRoom,
  ChatRoomDetail,
  ChatRoomAdmin,
  SessionChatRoom,
  ChatMessage,
  ChatRoomCreateData,
  ChatRoomUpdateData,
  PaginatedResponse,
} from '@/types';

/** Get chat rooms query parameters */
interface GetChatRoomMessagesParams {
  chatRoomId: number;
  page?: number;
  per_page?: number;
}

/** Send message payload */
interface SendMessageParams {
  chatRoomId: number;
  content: string;
}

/** Delete message payload */
interface DeleteMessageParams {
  chatRoomId: number;
  messageId: number;
}

/** Create chat room payload */
interface CreateChatRoomParams extends ChatRoomCreateData {
  eventId: number;
}

/** Update chat room payload */
interface UpdateChatRoomParams extends ChatRoomUpdateData {
  roomId: number;
}

/** Reorder chat room payload */
interface ReorderChatRoomParams {
  roomId: number;
  display_order: number;
}

// socket connectivity handled in networking/socketClient.js
export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all chat rooms for an event
    getChatRooms: builder.query<ChatRoom[], number>({
      query: (eventId) => ({
        url: `/events/${eventId}/chat-rooms`,
        method: 'GET',
      }),
      providesTags: ['ChatRoom'],
    }),

    // Get admin chat rooms (non-session)
    getEventAdminChatRooms: builder.query<ChatRoomAdmin[], number>({
      query: (eventId) => ({
        url: `/events/${eventId}/chat-rooms/admin`,
        method: 'GET',
      }),
      providesTags: ['ChatRoom'],
    }),

    // Create chat room
    createChatRoom: builder.mutation<ChatRoomDetail, CreateChatRoomParams>({
      query: ({ eventId, ...data }) => ({
        url: `/events/${eventId}/chat-rooms`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    // Update chat room
    updateChatRoom: builder.mutation<ChatRoomDetail, UpdateChatRoomParams>({
      query: ({ roomId, ...data }) => ({
        url: `/chat-rooms/${roomId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { roomId }) => [
        { type: 'ChatRoom', id: roomId },
      ],
    }),

    // Delete chat room
    deleteChatRoom: builder.mutation<void, number>({
      query: (roomId) => ({
        url: `/chat-rooms/${roomId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    // Toggle enable/disable
    toggleChatRoom: builder.mutation<ChatRoom, number>({
      query: (roomId) => ({
        url: `/chat-rooms/${roomId}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, roomId) => [
        { type: 'ChatRoom', id: roomId },
      ],
    }),

    // Reorder chat room
    reorderChatRoom: builder.mutation<ChatRoom, ReorderChatRoomParams>({
      query: ({ roomId, display_order }) => ({
        url: `/chat-rooms/${roomId}/reorder`,
        method: 'PUT',
        body: { display_order },
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    // Disable all public rooms
    disableAllPublicRooms: builder.mutation<void, number>({
      query: (eventId) => ({
        url: `/events/${eventId}/chat-rooms/disable-all-public`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    // Get messages for a specific chat room
    getChatRoomMessages: builder.query<
      PaginatedResponse<ChatMessage>,
      GetChatRoomMessagesParams
    >({
      query: ({ chatRoomId, page = 1, per_page = 50 }) => ({
        url: `/chat-rooms/${chatRoomId}/messages`,
        params: { page, per_page },
      }),
      providesTags: (_result, _error, { chatRoomId, page }) => [
        { type: 'ChatMessage', id: `ROOM_${chatRoomId}_PAGE_${page}` },
      ],
      // Keep args separate to avoid caching issues
      keepUnusedDataFor: 0, // Don't keep cached data when switching rooms
    }),

    // Send a message to a chat room
    sendMessage: builder.mutation<ChatMessage, SendMessageParams>({
      query: ({ chatRoomId, content }) => ({
        url: `/chat-rooms/${chatRoomId}/messages`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['ChatMessage'],
    }),

    // Delete (moderate) a message
    deleteMessage: builder.mutation<void, DeleteMessageParams>({
      query: ({ chatRoomId, messageId }) => ({
        url: `/chat-rooms/${chatRoomId}/messages/${messageId}`,
        method: 'DELETE',
      }),
      // We handle the update optimistically in the component
    }),

    // Join a chat room
    joinChatRoom: builder.mutation<void, number>({
      query: (chatRoomId) => ({
        url: `/chat-rooms/${chatRoomId}/join`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    // Leave a chat room
    leaveChatRoom: builder.mutation<void, number>({
      query: (chatRoomId) => ({
        url: `/chat-rooms/${chatRoomId}/leave`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    // Get chat rooms for a session
    getSessionChatRooms: builder.query<SessionChatRoom[], number>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/chat-rooms`,
        method: 'GET',
      }),
      providesTags: ['ChatRoom', 'SessionChatRoom'],
    }),
  }),
});

export const {
  useGetChatRoomsQuery,
  useGetEventAdminChatRoomsQuery,
  useCreateChatRoomMutation,
  useUpdateChatRoomMutation,
  useDeleteChatRoomMutation,
  useToggleChatRoomMutation,
  useReorderChatRoomMutation,
  useDisableAllPublicRoomsMutation,
  useGetChatRoomMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useJoinChatRoomMutation,
  useLeaveChatRoomMutation,
  useGetSessionChatRoomsQuery,
} = chatApi;

