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
      // No need to handle tokens - they're in cookies now
      transformResponse(response) {
        return response;
      },
    }),

    signup: builder.mutation({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
      // No token handling needed
      transformResponse: (response) => {
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
          console.log('getCurrentUser success:', data);
          dispatch(setUser(data));
        } catch (error) {
          // User is not authenticated - set authChecked to true
          console.log('getCurrentUser failed - user not authenticated');
          dispatch(setUser(null));
        }
      },
      providesTags: ['User'],
    }),
    refresh: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
        // No need for headers - refresh token is in cookies
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // After successful refresh, get current user data
          const userData = await dispatch(
            authApi.endpoints.getCurrentUser.initiate()
          ).unwrap();
          dispatch(setUser(userData));
        } catch (error) {
          console.error('Refresh failed:', error);
          dispatch(setUser(null));
          // Don't redirect here - let the router handle it
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
          // Clear Redux state
          dispatch(setUser(null));
          // Reset API state
          dispatch(baseApi.util.resetApiState());
          // Dispatch logout action to reset entire Redux state
          dispatch({ type: 'auth/logout' });
        } catch (error) {
          // Even if logout fails, we clear local state
          dispatch(setUser(null));
          dispatch(baseApi.util.resetApiState());
          dispatch({ type: 'auth/logout' });
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
