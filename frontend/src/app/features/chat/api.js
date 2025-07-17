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
      query: ({ chatRoomId, limit = 50, offset = 0 }) => ({
        url: `/chat-rooms/${chatRoomId}/messages`,
        params: { limit, offset },
      }),
      providesTags: ['ChatMessage'],
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
  useDisableAllPublicRoomsMutation,
  useGetChatRoomMessagesQuery,
  useSendMessageMutation,
  useJoinChatRoomMutation,
  useLeaveChatRoomMutation,
  useGetSessionChatRoomsQuery,
} = chatApi;
