// features/auth/api.js
import { baseApi } from '../api';
import { setUser, logout } from '../../store/authSlice';

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
        } catch {
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
          // Dispatch logout action to reset auth state
          dispatch(logout());
          // Reset API state
          dispatch(baseApi.util.resetApiState());
          
          // Force page refresh to clear any persistent state
          console.log('🔄 LOGOUT: Forcing page refresh to clear all state');
          window.location.reload();
        } catch {
          // Even if logout fails, we clear local state
          dispatch(logout());
          dispatch(baseApi.util.resetApiState());
          
          // Force page refresh even on error
          console.log('🔄 LOGOUT: Error occurred, but still forcing page refresh');
          window.location.reload();
        }
      },
      // Invalidate ALL cache tags on logout
      invalidatesTags: [
        'Auth', 'Users', 'Organizations', 'OrganizationUsers', 'Events', 'EventUsers',
        'Sessions', 'SessionSpeakers', 'ChatRoom', 'ChatMessage', 'SessionChatRoom',
        'Attendee', 'Connection', 'Connections', 'Thread', 'DirectMessage',
        'Sponsor', 'SponsorTiers', 'Dashboard', 'ModerationStatus'
      ],
    }),

    verifyEmail: builder.query({
      query: (token) => ({
        url: `/auth/verify-email/${token}`,
        method: 'GET',
      }),
    }),

    resendVerification: builder.mutation({
      query: (email) => ({
        url: '/auth/resend-verification',
        method: 'POST',
        body: { email },
      }),
    }),

    forgotPassword: builder.mutation({
      query: (email) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: { email },
      }),
    }),

    validateResetToken: builder.query({
      query: (token) => ({
        url: `/auth/reset-password/${token}`,
        method: 'GET',
      }),
    }),

    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: { token, password },
      }),
    }),

    verifyPassword: builder.mutation({
      query: ({ password }) => ({
        url: '/auth/verify-password',
        method: 'POST',
        body: { password },
      }),
    }),

    changePassword: builder.mutation({
      query: ({ current_password, new_password }) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: { current_password, new_password },
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetCurrentUserQuery,
  useRefreshMutation,
  useLogoutMutation,
  useVerifyEmailQuery,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useValidateResetTokenQuery,
  useResetPasswordMutation,
  useVerifyPasswordMutation,
  useChangePasswordMutation,
} = authApi;
