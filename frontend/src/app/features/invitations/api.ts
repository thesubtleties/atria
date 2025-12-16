import { baseApi } from '../api';
import type { User } from '@/types/auth';

interface InvitationDetailsParams {
  token: string;
}

interface OrganizationInvitation {
  id: number;
  organization_id: number;
  email: string;
  role: string;
  status: string;
  message?: string | null;
  created_at: string;
  expires_at: string;
}

interface EventInvitation {
  id: number;
  event_id: number;
  email: string;
  role: string;
  status: string;
  message?: string | null;
  created_at: string;
  expires_at: string;
}

interface InvitationDetailsResponse {
  invitation: OrganizationInvitation | EventInvitation;
  user_exists: boolean;
  all_invitations: (OrganizationInvitation | EventInvitation)[] | null;
}

interface RegisterAndAcceptParams {
  user_data: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
  };
  org_invitation_ids: number[];
  event_invitation_ids: number[];
}

interface RegisterAndAcceptResponse {
  user: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'full_name'>;
  access_token: string;
  refresh_token: string;
  accepted_invitations: {
    organizations: number;
    events: number;
  };
  message: string;
}

export const invitationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvitationDetails: builder.query<InvitationDetailsResponse, InvitationDetailsParams>({
      query: ({ token }) => ({
        url: `/invitations/${token}`,
      }),
      transformResponse: (response: InvitationDetailsResponse) => ({
        invitation: response.invitation,
        user_exists: response.user_exists,
        all_invitations: response.all_invitations ?? null,
      }),
    }),

    registerAndAcceptInvitations: builder.mutation<
      RegisterAndAcceptResponse,
      RegisterAndAcceptParams
    >({
      query: ({ user_data, org_invitation_ids, event_invitation_ids }) => ({
        url: '/invitations/register-and-accept',
        method: 'POST',
        body: {
          user_data,
          org_invitation_ids,
          event_invitation_ids,
        },
      }),
      transformResponse: (response: RegisterAndAcceptResponse) => ({
        user: response.user,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        accepted_invitations: response.accepted_invitations,
        message: response.message,
      }),
      invalidatesTags: ['Users', 'Organizations', 'Events', 'Dashboard'],
    }),
  }),
});

export const { useGetInvitationDetailsQuery, useRegisterAndAcceptInvitationsMutation } =
  invitationsApi;
