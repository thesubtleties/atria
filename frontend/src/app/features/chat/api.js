import { baseApi } from '../api';

// socket connectivity handled in networking/socketClient.js
export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all chat rooms for an event
    getChatRooms: builder.query({
      query: (eventId) => ({
        url: `/events/${eventId}/chat-rooms`,
        method: 'GET',
      }),
      providesTags: ['ChatRoom'],
    }),

    // Get admin chat rooms (non-session)
    getEventAdminChatRooms: builder.query({
      query: (eventId) => ({
        url: `/events/${eventId}/chat-rooms/admin`,
        method: 'GET',
      }),
      providesTags: ['ChatRoom', 'AdminChatRoom'],
    }),

    // Create chat room
    createChatRoom: builder.mutation({
      query: ({ eventId, ...data }) => ({
        url: `/events/${eventId}/chat-rooms`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ChatRoom', 'AdminChatRoom'],
    }),

    // Update chat room
    updateChatRoom: builder.mutation({
      query: ({ roomId, ...data }) => ({
        url: `/chat-rooms/${roomId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { roomId }) => [
        { type: 'ChatRoom', id: roomId },
        'AdminChatRoom',
      ],
    }),

    // Delete chat room
    deleteChatRoom: builder.mutation({
      query: (roomId) => ({
        url: `/chat-rooms/${roomId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ChatRoom', 'AdminChatRoom'],
    }),

    // Toggle enable/disable
    toggleChatRoom: builder.mutation({
      query: (roomId) => ({
        url: `/chat-rooms/${roomId}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, roomId) => [
        { type: 'ChatRoom', id: roomId },
        'AdminChatRoom',
      ],
    }),

    // Reorder chat room
    reorderChatRoom: builder.mutation({
      query: ({ roomId, display_order }) => ({
        url: `/chat-rooms/${roomId}/reorder`,
        method: 'PUT',
        body: { display_order },
      }),
      invalidatesTags: ['ChatRoom', 'AdminChatRoom'],
    }),

    // Disable all public rooms
    disableAllPublicRooms: builder.mutation({
      query: (eventId) => ({
        url: `/events/${eventId}/chat-rooms/disable-all-public`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatRoom', 'AdminChatRoom'],
    }),

    // Get messages for a specific chat room
    getChatRoomMessages: builder.query({
      query: ({ chatRoomId, page = 1, per_page = 50 }) => ({
        url: `/chat-rooms/${chatRoomId}/messages`,
        params: { page, per_page },
      }),
      providesTags: (result, error, { chatRoomId, page }) => [
        { type: 'ChatMessage', id: `ROOM_${chatRoomId}_PAGE_${page}` }
      ],
      // Keep args separate to avoid caching issues
      keepUnusedDataFor: 0, // Don't keep cached data when switching rooms
    }),

    // Send a message to a chat room
    sendMessage: builder.mutation({
      query: ({ chatRoomId, content }) => ({
        url: `/chat-rooms/${chatRoomId}/messages`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['ChatMessage'],
    }),

    // Delete (moderate) a message
    deleteMessage: builder.mutation({
      query: ({ chatRoomId, messageId }) => ({
        url: `/chat-rooms/${chatRoomId}/messages/${messageId}`,
        method: 'DELETE',
      }),
      // We handle the update optimistically in the component
    }),

    // Join a chat room
    joinChatRoom: builder.mutation({
      query: (chatRoomId) => ({
        url: `/chat-rooms/${chatRoomId}/join`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    // Leave a chat room
    leaveChatRoom: builder.mutation({
      query: (chatRoomId) => ({
        url: `/chat-rooms/${chatRoomId}/leave`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    // Get chat rooms for a session
    getSessionChatRooms: builder.query({
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
