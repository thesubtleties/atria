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
        // Change from string to object format
        url: '/auth/me', // Specify url property
        method: 'GET', // Explicitly set method
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
    //! This may need updated to remove double refresh... we still want this for api calls but we also are hitting it during refreshes...
    refresh: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      onQueryStarted(arg, { dispatch, queryFulfilled }) {
        queryFulfilled
          .then(({ data }) => {
            localStorage.setItem('access_token', data.access_token);
            return data;
          })
          .then(() => {
            return dispatch(
              authApi.endpoints.getCurrentUser.initiate()
            ).unwrap();
          })
          .then((userData) => {
            dispatch(setUser(userData));
          })
          .catch((error) => {
            console.error('Refresh flow failed:', error);
            dispatch(setUser(null));
          });
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
