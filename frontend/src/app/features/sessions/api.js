import { baseApi } from '../api';

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query({
      query: ({ eventId, dayNumber, page = 1, per_page = 50 }) => ({
        url: `/events/${eventId}/sessions`,
        params: { day_number: dayNumber, page, per_page },
      }),
      providesTags: ['Sessions'],
    }),
    getSession: builder.query({
      query: (id) => {
        console.log('Getting session with ID:', id);
        return {
          url: `/sessions/${id}`,
        };
      },
      providesTags: (result, error, id) => [{ type: 'Sessions', id }],
    }),
    createSession: builder.mutation({
      query: ({ eventId, ...sessionData }) => ({
        url: `/events/${eventId}/sessions`,
        method: 'POST',
        body: sessionData,
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'Events', id: eventId },
        'Events',
        'Sessions',
      ],
    }),
    updateSession: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/sessions/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        'Sessions',
        { type: 'Sessions', id },
      ],
    }),
    updateSessionStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/sessions/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sessions', id }],
    }),
    updateSessionTimes: builder.mutation({
      query: ({ id, ...times }) => ({
        url: `/sessions/${id}/times`,
        method: 'PUT',
        body: times,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sessions', id }],
    }),
    // Session Speakers endpoints
    getSessionSpeakers: builder.query({
      query: ({ sessionId, role, page = 1, per_page = 50 }) => ({
        url: `/sessions/${sessionId}/speakers`,
        params: { role, page, per_page },
      }),
      providesTags: ['SessionSpeakers'],
    }),
    addSessionSpeaker: builder.mutation({
      query: ({ sessionId, ...speakerData }) => ({
        url: `/sessions/${sessionId}/speakers`,
        method: 'POST',
        body: speakerData,
      }),
      invalidatesTags: ['SessionSpeakers'],
    }),
    updateSessionSpeaker: builder.mutation({
      query: ({ sessionId, userId, ...updates }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['SessionSpeakers'],
    }),
    reorderSessionSpeaker: builder.mutation({
      query: ({ sessionId, userId, order }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}/reorder`,
        method: 'PUT',
        body: { order },
      }),
      invalidatesTags: ['SessionSpeakers'],
    }),
    removeSessionSpeaker: builder.mutation({
      query: ({ sessionId, userId }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SessionSpeakers'],
    }),
    deleteSession: builder.mutation({
      query: (id) => ({
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
