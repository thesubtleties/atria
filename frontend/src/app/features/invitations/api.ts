import { baseApi } from '../api';

interface InvitationDetailsParams {
  token: string;
}

interface InvitationDetailsResponse {
  invitation: any;
  user_exists: boolean;
  all_invitations: any[] | null;
}

interface RegisterAndAcceptParams {
  user_data: any;
  org_invitation_ids: number[];
  event_invitation_ids: number[];
}

interface RegisterAndAcceptResponse {
  user: any;
  access_token: string;
  refresh_token: string;
  accepted_invitations: any[];
  message: string;
}

export const invitationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvitationDetails: builder.query<InvitationDetailsResponse, InvitationDetailsParams>({
      query: ({ token }) => ({
        url: `/invitations/${token}`,
      }),
      transformResponse: (response: any) => ({
        invitation: response.invitation,
        user_exists: response.user_exists,
        all_invitations: response.all_invitations || null
      })
    }),

    registerAndAcceptInvitations: builder.mutation<RegisterAndAcceptResponse, RegisterAndAcceptParams>({
      query: ({ user_data, org_invitation_ids, event_invitation_ids }) => ({
        url: '/invitations/register-and-accept',
        method: 'POST',
        body: {
          user_data,
          org_invitation_ids,
          event_invitation_ids
        }
      }),
      transformResponse: (response: any) => ({
        user: response.user,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        accepted_invitations: response.accepted_invitations,
        message: response.message
      }),
      invalidatesTags: ['User', 'Organizations', 'Events', 'Dashboard']
    })
  })
});

export const {
  useGetInvitationDetailsQuery,
  useRegisterAndAcceptInvitationsMutation
} = invitationsApi;