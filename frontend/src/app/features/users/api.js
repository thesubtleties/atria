import { baseApi } from '../api';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => ({
        url: `/users/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),
    checkUserExists: builder.query({
      query: (email) => ({
        url: `/users/check-email?email=${encodeURIComponent(email)}`,
        method: 'GET',
      }),
      providesTags: ['Users'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id },
        { type: 'Dashboard', id },
        'EventUsers',      // Invalidate attendee lists to show updated profile
        'ChatMessage',     // Invalidate chat messages to show updated avatar
        'SessionSpeakers'  // Invalidate speaker lists to show updated info
      ],
    }),
    getUserEvents: builder.query({
      query: ({ userId, role, page = 1, per_page = 50 }) => ({
        url: `/users/${userId}/events`,
        params: { role, page, per_page },
      }),
      providesTags: ['Events'],
    }),
    getUserSpeakingSessions: builder.query({
      query: (userId) => ({
        url: `/users/${userId}/speaking-sessions`,
      }),
      providesTags: ['Sessions'],
    }),
    getUserDashboard: builder.query({
      query: (userId) => ({
        url: `/users/${userId}/dashboard`,
      }),
      providesTags: (result, error, userId) => [
        { type: 'Dashboard', id: userId },
        'Organizations',
        'Events',
        'Connections'
      ],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),
    getUserInvitations: builder.query({
      query: (userId) => ({
        url: `/users/${userId}/invitations`,
      }),
      providesTags: ['Invitations'],
    }),
    
    getUserPrivacySettings: builder.query({
      query: (id) => ({ url: `/users/${id}/privacy-settings` }),
      providesTags: (result, error, id) => [{ type: 'UserPrivacy', id }],
    }),
    
    updateUserPrivacySettings: builder.mutation({
      query: ({ id, ...settings }) => ({
        url: `/users/${id}/privacy-settings`,
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'UserPrivacy', id },
        { type: 'Users', id },
        'EventUsers', // Refresh attendee lists as privacy affects visibility
      ],
    }),
    
    getEventPrivacyOverrides: builder.query({
      query: ({ userId, eventId }) => ({ 
        url: `/users/${userId}/events/${eventId}/privacy-overrides` 
      }),
      providesTags: (result, error, { userId, eventId }) => [
        { type: 'EventPrivacy', id: `${userId}-${eventId}` }
      ],
    }),
    
    updateEventPrivacyOverrides: builder.mutation({
      query: ({ userId, eventId, ...overrides }) => ({
        url: `/users/${userId}/events/${eventId}/privacy-overrides`,
        method: 'PUT',
        body: overrides,
      }),
      invalidatesTags: (result, error, { userId, eventId }) => [
        { type: 'EventPrivacy', id: `${userId}-${eventId}` },
        { type: 'UserPrivacy', id: userId },
        'EventUsers', // Refresh attendee lists as privacy affects visibility
      ],
    }),
    
    deleteEventPrivacyOverrides: builder.mutation({
      query: ({ userId, eventId }) => ({
        url: `/users/${userId}/events/${eventId}/privacy-overrides`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { userId, eventId }) => [
        { type: 'EventPrivacy', id: `${userId}-${eventId}` },
        { type: 'UserPrivacy', id: userId },
        'EventUsers',
      ],
    }),
  }),
});

export const {
  useGetUserQuery,
  useCheckUserExistsQuery,
  useUpdateUserMutation,
  useGetUserEventsQuery,
  useGetUserSpeakingSessionsQuery,
  useGetUserDashboardQuery,
  useGetUserInvitationsQuery,
  useGetUserPrivacySettingsQuery,
  useUpdateUserPrivacySettingsMutation,
  useGetEventPrivacyOverridesQuery,
  useUpdateEventPrivacyOverridesMutation,
  useDeleteEventPrivacyOverridesMutation,
} = usersApi;
