import { baseApi } from '../api';

interface ModerationStatusParams {
  eventId: number;
  userId: number;
}

interface ModerationStatusResponse {
  is_banned: boolean;
  is_chat_banned: boolean;
  ban_reason: string | null;
  chat_ban_reason: string | null;
  banned_at: string | null;
  chat_ban_until: string | null;
  banned_by: number | null;
  can_use_chat: boolean;
}

interface BanUserParams {
  eventId: number;
  userId: number;
  reason: string;
  moderation_notes?: string;
}

interface UnbanUserParams {
  eventId: number;
  userId: number;
}

interface ChatBanUserParams {
  eventId: number;
  userId: number;
  reason: string;
  moderation_notes?: string;
  duration_hours?: number;
}

interface ChatUnbanUserParams {
  eventId: number;
  userId: number;
}

export const moderationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModerationStatus: builder.query<ModerationStatusResponse, ModerationStatusParams>({
      query: ({ eventId, userId }) => ({
        url: `/events/${eventId}/users/${userId}/moderation-status`,
      }),
      providesTags: (_result, _error, { eventId, userId }) => [
        { type: 'ModerationStatus', id: `${eventId}-${userId}` },
      ],
    }),
    banEventUser: builder.mutation<void, BanUserParams>({
      query: ({ eventId, userId, ...banData }) => ({
        url: `/events/${eventId}/users/${userId}/ban`,
        method: 'POST',
        body: banData,
      }),
      invalidatesTags: (_result, _error, { eventId, userId }) => [
        'EventUsers',
        { type: 'ModerationStatus', id: `${eventId}-${userId}` },
      ],
    }),
    unbanEventUser: builder.mutation<void, UnbanUserParams>({
      query: ({ eventId, userId }) => ({
        url: `/events/${eventId}/users/${userId}/unban`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { eventId, userId }) => [
        'EventUsers',
        { type: 'ModerationStatus', id: `${eventId}-${userId}` },
      ],
    }),
    chatBanEventUser: builder.mutation<void, ChatBanUserParams>({
      query: ({ eventId, userId, ...chatBanData }) => ({
        url: `/events/${eventId}/users/${userId}/chat-ban`,
        method: 'POST',
        body: chatBanData,
      }),
      invalidatesTags: (_result, _error, { eventId, userId }) => [
        'EventUsers',
        { type: 'ModerationStatus', id: `${eventId}-${userId}` },
      ],
    }),
    chatUnbanEventUser: builder.mutation<void, ChatUnbanUserParams>({
      query: ({ eventId, userId }) => ({
        url: `/events/${eventId}/users/${userId}/chat-unban`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { eventId, userId }) => [
        'EventUsers',
        { type: 'ModerationStatus', id: `${eventId}-${userId}` },
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
