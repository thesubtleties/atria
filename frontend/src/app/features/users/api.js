import { baseApi } from '../api';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => ({
        url: `/users/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Users', id }],
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
  }),
});

export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useGetUserEventsQuery,
  useGetUserSpeakingSessionsQuery,
} = usersApi;
