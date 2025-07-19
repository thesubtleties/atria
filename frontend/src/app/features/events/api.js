import { baseApi } from '../api';

export const eventsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query({
      query: ({ orgId, page = 1, per_page = 50 }) => ({
        url: `/organizations/${orgId}/events`,
        params: { page, per_page },
      }),
      providesTags: ['Events'],
    }),
    getEvent: builder.query({
      query: (id) => ({
        url: `/events/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Events', id }],
    }),
    createEvent: builder.mutation({
      query: ({ orgId, ...eventData }) => ({
        url: `/organizations/${orgId}/events`,
        method: 'POST',
        body: eventData,
      }),
      invalidatesTags: ['Events'],
    }),
    deleteEvent: builder.mutation({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Events'],
    }),
    updateEvent: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Events', id },
        'Events',
      ],
    }),
    updateEventBranding: builder.mutation({
      query: ({ id, ...branding }) => ({
        url: `/events/${id}/branding`,
        method: 'PUT',
        body: branding,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Events', id }],
    }),
    // Event Users endpoints
    getEventUsers: builder.query({
      query: ({ eventId, role, page = 1, per_page = 50 }) => ({
        url: `/events/${eventId}/users`,
        params: { role, page, per_page },
      }),
      providesTags: ['EventUsers'],
    }),
    // Admin view with sensitive information
    getEventUsersAdmin: builder.query({
      query: ({ eventId, role, page = 1, per_page = 50 }) => ({
        url: `/events/${eventId}/users/admin`,
        params: { role, page, per_page },
      }),
      providesTags: ['EventUsers'],
    }),
    addEventUser: builder.mutation({
      query: ({ eventId, ...userData }) => ({
        url: `/events/${eventId}/users`,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['EventUsers'],
    }),
    addOrCreateEventUser: builder.mutation({
      query: ({ eventId, ...userData }) => ({
        url: `/events/${eventId}/users/add`, // Note the /add here
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['EventUsers'],
    }),
    updateEventUser: builder.mutation({
      query: ({ eventId, userId, ...updates }) => ({
        url: `/events/${eventId}/users/${userId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['EventUsers'],
    }),
    updateEventSpeakerInfo: builder.mutation({
      query: ({ eventId, userId, ...info }) => ({
        url: `/events/${eventId}/users/${userId}/speaker-info`,
        method: 'PUT',
        body: info,
      }),
      invalidatesTags: ['EventUsers'],
    }),
    removeEventUser: builder.mutation({
      query: ({ eventId, userId }) => ({
        url: `/events/${eventId}/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['EventUsers'],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useUpdateEventBrandingMutation,
  useGetEventUsersQuery,
  useGetEventUsersAdminQuery,
  useAddEventUserMutation,
  useUpdateEventUserMutation,
  useUpdateEventSpeakerInfoMutation,
  useDeleteEventMutation,
  useAddOrCreateEventUserMutation,
  useRemoveEventUserMutation,
} = eventsApi;
