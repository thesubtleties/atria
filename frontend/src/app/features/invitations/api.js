import { baseApi } from '../api';

export const invitationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get invitation details by token (public endpoint)
    getInvitationDetails: builder.query({
      query: (token) => ({
        url: `/invitations/${token}`,
      }),
      transformResponse: (response) => ({
        invitation: response.invitation,
        user_exists: response.user_exists,
        all_invitations: response.all_invitations || null
      })
    }),

    // Register new user and accept invitations (public endpoint)
    registerAndAcceptInvitations: builder.mutation({
      query: ({ user_data, org_invitation_ids, event_invitation_ids }) => ({
        url: '/invitations/register-and-accept',
        method: 'POST',
        body: {
          user_data,
          org_invitation_ids,
          event_invitation_ids
        }
      }),
      transformResponse: (response) => ({
        user: response.user,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        accepted_invitations: response.accepted_invitations,
        message: response.message
      }),
      // Invalidate relevant tags after successful registration
      invalidatesTags: ['User', 'Organizations', 'Events', 'Dashboard']
    })
  })
});

export const {
  useGetInvitationDetailsQuery,
  useRegisterAndAcceptInvitationsMutation
} = invitationsApi;