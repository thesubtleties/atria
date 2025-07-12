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
  useGetChatRoomMessagesQuery,
  useSendMessageMutation,
  useJoinChatRoomMutation,
  useLeaveChatRoomMutation,
  useGetSessionChatRoomsQuery,
} = chatApi;
