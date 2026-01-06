import { baseApi } from '../api';
import type { SessionSpeaker } from '@/types';
import type { SessionType, SessionStatus, SessionSpeakerRole } from '@/types/enums';

type Session = {
  id: number;
  title: string;
  description?: string;
  session_type: SessionType;
  day_number: number;
  start_time: string;
  end_time: string;
  location?: string;
  capacity?: number;
  status: SessionStatus;
  event_id: number;
  created_at: string;
  updated_at: string;
};

type GetSessionsParams = {
  eventId: number;
  dayNumber?: number;
  page?: number;
  per_page?: number;
};

type GetSessionsResponse = {
  sessions: Session[];
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  self?: string;
  first?: string;
  last?: string;
  next?: string;
  prev?: string;
};

type GetSessionParams = {
  id: number;
};

type CreateSessionParams = {
  eventId: number;
  title: string;
  description?: string;
  session_type: SessionType;
  day_number: number;
  start_time: string;
  end_time: string;
  location?: string;
  capacity?: number;
};

type UpdateSessionParams = {
  id: number;
  title?: string;
  description?: string;
  session_type?: SessionType;
  day_number?: number;
  start_time?: string;
  end_time?: string;
  location?: string;
  capacity?: number;
  status?: SessionStatus;
};

type UpdateSessionStatusParams = {
  id: number;
  status: SessionStatus;
};

type UpdateSessionTimesParams = {
  id: number;
  start_time?: string;
  end_time?: string;
};

type GetSessionSpeakersParams = {
  sessionId: number;
  role?: SessionSpeakerRole;
  page?: number;
  per_page?: number;
};

type GetSessionSpeakersResponse = {
  speakers: SessionSpeaker[];
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  self?: string;
  first?: string;
  last?: string;
  next?: string;
  prev?: string;
};

type AddSessionSpeakerParams = {
  sessionId: number;
  user_id: number;
  role: SessionSpeakerRole;
  order?: number;
};

type UpdateSessionSpeakerParams = {
  sessionId: number;
  userId: number;
  role?: SessionSpeakerRole;
  order?: number;
  bio?: string;
};

type ReorderSessionSpeakerParams = {
  sessionId: number;
  userId: number;
  order: number;
};

type RemoveSessionSpeakerParams = {
  sessionId: number;
  userId: number;
};

type DeleteSessionParams = {
  id: number;
};

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<GetSessionsResponse, GetSessionsParams>({
      query: ({ eventId, dayNumber, page = 1, per_page = 50 }) => ({
        url: `/events/${eventId}/sessions`,
        params: { day_number: dayNumber, page, per_page },
      }),
      // Provide tags for each session + a LIST tag
      // This allows updateSession to invalidate just the specific session in the cache
      // without refetching the entire list
      providesTags: (result) =>
        result ?
          [
            ...result.sessions.map(({ id }) => ({ type: 'Sessions' as const, id })),
            { type: 'Sessions' as const, id: 'LIST' },
          ]
        : [{ type: 'Sessions' as const, id: 'LIST' }],
    }),
    getSession: builder.query<Session, GetSessionParams>({
      query: ({ id }) => ({
        url: `/sessions/${id}`,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'Sessions' as const, id }],
    }),
    createSession: builder.mutation<Session, CreateSessionParams>({
      query: ({ eventId, ...sessionData }) => ({
        url: `/events/${eventId}/sessions`,
        method: 'POST',
        body: sessionData,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: 'Events' as const, id: eventId },
        'Events',
        { type: 'Sessions' as const, id: 'LIST' },
      ],
    }),
    updateSession: builder.mutation<Session, UpdateSessionParams>({
      query: ({ id, ...updates }) => ({
        url: `/sessions/${id}`,
        method: 'PUT',
        body: updates,
      }),
      // Only invalidate the specific session, not the entire list
      // This prevents full list refetch on every toggle/edit which causes lag
      // The SessionCard manages local state for immediate visual feedback
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Sessions' as const, id }],
    }),
    updateSessionStatus: builder.mutation<void, UpdateSessionStatusParams>({
      query: ({ id, status }) => ({
        url: `/sessions/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Sessions' as const, id }],
    }),
    updateSessionTimes: builder.mutation<void, UpdateSessionTimesParams>({
      query: ({ id, ...times }) => ({
        url: `/sessions/${id}/times`,
        method: 'PUT',
        body: times,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Sessions' as const, id }],
    }),
    getSessionSpeakers: builder.query<GetSessionSpeakersResponse, GetSessionSpeakersParams>({
      query: ({ sessionId, role, page = 1, per_page = 50 }) => ({
        url: `/sessions/${sessionId}/speakers`,
        params: { role, page, per_page },
      }),
      providesTags: ['SessionSpeakers'],
    }),
    addSessionSpeaker: builder.mutation<void, AddSessionSpeakerParams>({
      query: ({ sessionId, ...speakerData }) => ({
        url: `/sessions/${sessionId}/speakers`,
        method: 'POST',
        body: speakerData,
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [
        'SessionSpeakers',
        { type: 'Sessions' as const, id: sessionId },
        'EventUsers',
      ],
    }),
    updateSessionSpeaker: builder.mutation<void, UpdateSessionSpeakerParams>({
      query: ({ sessionId, userId, ...updates }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [
        'SessionSpeakers',
        { type: 'Sessions' as const, id: sessionId },
      ],
    }),
    reorderSessionSpeaker: builder.mutation<void, ReorderSessionSpeakerParams>({
      query: ({ sessionId, userId, order }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}/reorder`,
        method: 'PUT',
        body: { order },
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [
        'SessionSpeakers',
        { type: 'Sessions' as const, id: sessionId },
      ],
    }),
    removeSessionSpeaker: builder.mutation<void, RemoveSessionSpeakerParams>({
      query: ({ sessionId, userId }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [
        'SessionSpeakers',
        { type: 'Sessions' as const, id: sessionId },
        'EventUsers',
      ],
    }),
    deleteSession: builder.mutation<void, DeleteSessionParams>({
      query: ({ id }) => ({
        url: `/sessions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Sessions' as const, id },
        { type: 'Sessions' as const, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useGetSessionQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useUpdateSessionStatusMutation,
  useUpdateSessionTimesMutation,
  useGetSessionSpeakersQuery,
  useAddSessionSpeakerMutation,
  useUpdateSessionSpeakerMutation,
  useReorderSessionSpeakerMutation,
  useRemoveSessionSpeakerMutation,
  useDeleteSessionMutation,
} = sessionsApi;
