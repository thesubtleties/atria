import { baseApi } from '../api';

export const moderationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModerationStatus: builder.query({
      query: ({ eventId, userId }) => ({
        url: `/events/${eventId}/users/${userId}/moderation-status`,
      }),
      providesTags: (result, error, { eventId, userId }) => [
        { type: 'ModerationStatus', id: `${eventId}-${userId}` }
      ],
    }),
    banEventUser: builder.mutation({
      query: ({ eventId, userId, ...banData }) => ({
        url: `/events/${eventId}/users/${userId}/ban`,
        method: 'POST',
        body: banData,
      }),
      invalidatesTags: (result, error, { eventId, userId }) => [
        'EventUsers',
        { type: 'ModerationStatus', id: `${eventId}-${userId}` }
      ],
    }),
    unbanEventUser: builder.mutation({
      query: ({ eventId, userId, ...unbanData }) => ({
        url: `/events/${eventId}/users/${userId}/unban`,
        method: 'POST',
        body: unbanData,
      }),
      invalidatesTags: (result, error, { eventId, userId }) => [
        'EventUsers',
        { type: 'ModerationStatus', id: `${eventId}-${userId}` }
      ],
    }),
    chatBanEventUser: builder.mutation({
      query: ({ eventId, userId, ...chatBanData }) => ({
        url: `/events/${eventId}/users/${userId}/chat-ban`,
        method: 'POST',
        body: chatBanData,
      }),
      invalidatesTags: (result, error, { eventId, userId }) => [
        'EventUsers',
        { type: 'ModerationStatus', id: `${eventId}-${userId}` }
      ],
    }),
    chatUnbanEventUser: builder.mutation({
      query: ({ eventId, userId, ...chatUnbanData }) => ({
        url: `/events/${eventId}/users/${userId}/chat-unban`,
        method: 'POST',
        body: chatUnbanData,
      }),
      invalidatesTags: (result, error, { eventId, userId }) => [
        'EventUsers',
        { type: 'ModerationStatus', id: `${eventId}-${userId}` }
      ],
    }),
  }),
});

export const {
  useGetModerationStatusQuery,
  useBanEventUserMutation,
  useUnbanEventUserMutation,
  useChatBanEventUserMutation,
  useChatUnbanEventUserMutation,
} = moderationApi;