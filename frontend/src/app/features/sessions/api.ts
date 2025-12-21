import { baseApi } from '../api';
import type { SessionSpeaker } from '@/types';

interface Session {
  id: number;
  title: string;
  description?: string;
  session_type: string;
  day_number: number;
  start_time: string;
  end_time: string;
  location?: string;
  capacity?: number;
  status: string;
  event_id: number;
  created_at: string;
  updated_at: string;
}

interface GetSessionsParams {
  eventId: number;
  dayNumber?: number;
  page?: number;
  per_page?: number;
}

interface GetSessionsResponse {
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
}

interface GetSessionParams {
  id: number;
}

interface CreateSessionParams {
  eventId: number;
  title: string;
  description?: string;
  session_type: string;
  day_number: number;
  start_time: string;
  end_time: string;
  location?: string;
  capacity?: number;
}

interface UpdateSessionParams {
  id: number;
  title?: string;
  description?: string;
  session_type?: string;
  day_number?: number;
  start_time?: string;
  end_time?: string;
  location?: string;
  capacity?: number;
  status?: string;
}

interface UpdateSessionStatusParams {
  id: number;
  status: string;
}

interface UpdateSessionTimesParams {
  id: number;
  start_time?: string;
  end_time?: string;
}

interface GetSessionSpeakersParams {
  sessionId: number;
  role?: string;
  page?: number;
  per_page?: number;
}

interface GetSessionSpeakersResponse {
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
}

interface AddSessionSpeakerParams {
  sessionId: number;
  user_id: number;
  role: string;
  order?: number;
}

interface UpdateSessionSpeakerParams {
  sessionId: number;
  userId: number;
  role?: string;
  order?: number;
  bio?: string;
}

interface ReorderSessionSpeakerParams {
  sessionId: number;
  userId: number;
  order: number;
}

interface RemoveSessionSpeakerParams {
  sessionId: number;
  userId: number;
}

interface DeleteSessionParams {
  id: number;
}

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<GetSessionsResponse, GetSessionsParams>({
      query: ({ eventId, dayNumber, page = 1, per_page = 50 }) => ({
        url: `/events/${eventId}/sessions`,
        params: { day_number: dayNumber, page, per_page },
      }),
      providesTags: ['Sessions'],
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
        'Sessions',
      ],
    }),
    updateSession: builder.mutation<Session, UpdateSessionParams>({
      query: ({ id, ...updates }) => ({
        url: `/sessions/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Sessions', { type: 'Sessions' as const, id }],
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
      invalidatesTags: ['SessionSpeakers', 'Sessions', 'EventUsers'],
    }),
    updateSessionSpeaker: builder.mutation<void, UpdateSessionSpeakerParams>({
      query: ({ sessionId, userId, ...updates }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['SessionSpeakers', 'Sessions'],
    }),
    reorderSessionSpeaker: builder.mutation<void, ReorderSessionSpeakerParams>({
      query: ({ sessionId, userId, order }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}/reorder`,
        method: 'PUT',
        body: { order },
      }),
      invalidatesTags: ['SessionSpeakers', 'Sessions'],
    }),
    removeSessionSpeaker: builder.mutation<void, RemoveSessionSpeakerParams>({
      query: ({ sessionId, userId }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SessionSpeakers', 'Sessions', 'EventUsers'],
    }),
    deleteSession: builder.mutation<void, DeleteSessionParams>({
      query: ({ id }) => ({
        url: `/sessions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sessions'],
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
