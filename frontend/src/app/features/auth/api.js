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
      transformResponse: (response) => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        return response;
      },
    }),

    signup: builder.mutation({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
      // Just handle tokens
      transformResponse: (response) => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        return response;
      },
    }),

    // Get current user data - no transformResponse needed because no token handling
    getCurrentUser: builder.query({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log(data);
          dispatch(setUser(data));
        } catch {
          dispatch(setUser(null));
        }
      },
      providesTags: ['User'],
    }),
    refresh: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          localStorage.setItem('access_token', data.access_token);
          // Get current user data
          const userData = await dispatch(
            authApi.endpoints.getCurrentUser.initiate()
          ).unwrap();
          dispatch(setUser(userData));
        } catch (error) {
          console.error('Refresh flow failed:', error);
          // Clear all auth state on refresh failure
          localStorage.clear();
          dispatch(setUser(null));
          window.location.href = '/';
        }
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
