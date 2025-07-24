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
        { type: 'Dashboard', id }
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
  }),
});

export const {
  useGetUserQuery,
  useCheckUserExistsQuery,
  useUpdateUserMutation,
  useGetUserEventsQuery,
  useGetUserSpeakingSessionsQuery,
  useGetUserDashboardQuery,
} = usersApi;
