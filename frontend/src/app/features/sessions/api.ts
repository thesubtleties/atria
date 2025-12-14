import { baseApi } from '../api';

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

interface SessionSpeaker {
  user_id: number;
  full_name: string;
  avatar_url?: string;
  role: string;
  order: number;
  bio?: string;
}

interface GetSessionsParams {
  eventId: number;
  dayNumber?: number;
  page?: number;
  per_page?: number;
}

interface GetSessionsResponse {
  sessions: Session[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
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
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
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
      refetchOnMountOrArgChange: 300,
    }),
    getSession: builder.query<Session, GetSessionParams>({
      query: ({ id }) => ({
        url: `/sessions/${id}`,
      }),
      providesTags: (result, error, { id }) => [{ type: 'Sessions' as const, id }],
      refetchOnMountOrArgChange: 300,
    }),
    createSession: builder.mutation<Session, CreateSessionParams>({
      query: ({ eventId, ...sessionData }) => ({
        url: `/events/${eventId}/sessions`,
        method: 'POST',
        body: sessionData,
      }),
      invalidatesTags: (result, error, { eventId }) => [
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
      invalidatesTags: (result, error, { id }) => [
        'Sessions',
        { type: 'Sessions' as const, id },
      ],
    }),
    updateSessionStatus: builder.mutation<void, UpdateSessionStatusParams>({
      query: ({ id, status }) => ({
        url: `/sessions/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sessions' as const, id }],
    }),
    updateSessionTimes: builder.mutation<void, UpdateSessionTimesParams>({
      query: ({ id, ...times }) => ({
        url: `/sessions/${id}/times`,
        method: 'PUT',
        body: times,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sessions' as const, id }],
    }),
    getSessionSpeakers: builder.query<GetSessionSpeakersResponse, GetSessionSpeakersParams>({
      query: ({ sessionId, role, page = 1, per_page = 50 }) => ({
        url: `/sessions/${sessionId}/speakers`,
        params: { role, page, per_page },
      }),
      providesTags: ['SessionSpeakers'],
      refetchOnMountOrArgChange: 300,
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
