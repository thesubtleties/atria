// features/auth/api.js
import { baseApi } from '../api';
import { setUser } from '../../store/authSlice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      // transformResponse for login because we need to handle tokens
      transformResponse: (response) => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        return response;
      },
      // After login success, fetch user data
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // After successful login, fetch user data
          const result = await dispatch(
            authApi.endpoints.getCurrentUser.initiate()
          );
          if (result.data) {
            dispatch(setUser(result.data));
          }
        } catch {
          dispatch(setUser(null));
        }
      },
      invalidatesTags: ['Auth'],
    }),

    signup: builder.mutation({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response) => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        return response;
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // After successful signup, fetch user data
          const result = await dispatch(
            authApi.endpoints.getCurrentUser.initiate()
          );
          if (result.data) {
            dispatch(setUser(result.data));
          }
        } catch {
          dispatch(setUser(null));
        }
      },
      invalidatesTags: ['Auth'],
    }),

    // Get current user data - no transformResponse needed because no token handling
    getCurrentUser: builder.query({
      query: () => '/auth/me',
      // Only need onQueryStarted to update Redux state with user data
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {
          dispatch(setUser(null));
        }
      },
      providesTags: ['User'], // Add this for cache invalidation
    }),

    refresh: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      transformResponse: (response) => {
        localStorage.setItem('access_token', response.access_token);
        return response;
      },
    }),

    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clean up tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Clear Redux state
          dispatch(setUser(null));
          // Reset API state
          dispatch(baseApi.util.resetApiState());
        } catch (error) {
          // Even if logout fails, we might want to clean up locally
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          dispatch(setUser(null));
        }
      },
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetCurrentUserQuery,
  useRefreshMutation,
  useLogoutMutation,
} = authApi;
