import { baseApi } from '../api';
import type {
  Organization,
  OrganizationDetail,
  OrganizationUserNested,
  OrganizationCreateData,
  OrganizationUpdateData,
  OrganizationUserRoleUpdateData,
  OrganizationMuxCredentialsData,
  OrganizationJaasCredentialsData,
  OrganizationUserRole,
  PaginatedResponse,
} from '@/types';

/** Organization invitation */
type OrganizationInvitation = {
  id: number;
  email: string;
  role: OrganizationUserRole;
  status: 'pending' | 'accepted' | 'expired' | 'declined' | 'cancelled';
  created_at: string;
  expires_at: string;
};

/** Invitation preview from token */
type OrganizationInvitationPreview = {
  email: string;
  role: OrganizationUserRole;
  organization: {
    id: number;
    name: string;
  };
  invited_by: {
    full_name: string;
  };
};

/** Get organization users query parameters */
type GetOrganizationUsersParams = {
  orgId: number;
  role?: OrganizationUserRole;
  page?: number;
  per_page?: number;
};

/** Get organization invitations query parameters */
type GetOrganizationInvitationsParams = {
  orgId: number;
  page?: number;
  per_page?: number;
};

/** Add organization user payload
 * This endpoint can create a new user or add existing user by email
 */
type AddOrganizationUserParams = {
  orgId: number;
  email: string;
  first_name: string;
  last_name: string;
  password?: string | undefined; // Optional - used only for new user creation
  role: OrganizationUserRole;
};

/** Update organization user payload */
type UpdateOrganizationUserParams = OrganizationUserRoleUpdateData & {
  orgId: number;
  userId: number;
};

/** Remove organization user payload */
type RemoveOrganizationUserParams = {
  orgId: number;
  userId: number;
};

/** Send organization invitation payload */
type SendOrganizationInvitationParams = {
  orgId: number;
  email: string;
  role: OrganizationUserRole;
};

/** Bulk send organization invitations payload */
type BulkSendOrganizationInvitationsParams = {
  orgId: number;
  invitations: Array<{
    email: string;
    role: OrganizationUserRole;
  }>;
};

/** Cancel organization invitation payload */
type CancelOrganizationInvitationParams = {
  orgId: number;
  invitationId: number;
};

/** Update organization payload with ID */
type UpdateOrganizationParams = OrganizationUpdateData & {
  id: number;
};

/** Update Mux credentials payload with org ID */
type UpdateMuxCredentialsParams = OrganizationMuxCredentialsData & {
  orgId: number;
};

/** Update JaaS credentials payload with org ID */
type UpdateJaasCredentialsParams = OrganizationJaasCredentialsData & {
  orgId: number;
};

/** Response for getOrganizations - paginated */
type GetOrganizationsResponse = {
  organizations: Organization[];
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  self?: string;
  first?: string;
  last?: string;
  next?: string;
  prev?: string;
};

/** Generic message response */
type MessageResponse = {
  message: string;
};

/** Bulk invitation response */
type BulkInvitationResponse = {
  sent: number;
  failed: number;
  errors?: Array<{ email: string; error: string }>;
};

export const organizationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizations: builder.query<GetOrganizationsResponse, void>({
      query: () => ({
        url: '/organizations',
      }),
      providesTags: ['Organizations'],
    }),

    getOrganization: builder.query<OrganizationDetail, number>({
      query: (id) => ({
        url: `/organizations/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Organizations', id }],
      // Organizations rarely change, keep cache longer
      keepUnusedDataFor: 600,
    }),

    createOrganization: builder.mutation<Organization, OrganizationCreateData>({
      query: (orgData) => ({
        url: '/organizations',
        method: 'POST',
        body: orgData,
      }),
      invalidatesTags: ['Organizations'],
    }),

    updateOrganization: builder.mutation<Organization, UpdateOrganizationParams>({
      query: ({ id, ...updates }) => ({
        url: `/organizations/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Organizations', id },
        'Organizations',
      ],
    }),

    deleteOrganization: builder.mutation<void, number>({
      query: (id) => ({
        url: `/organizations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Organizations'],
    }),

    // Organization Users endpoints
    getOrganizationUsers: builder.query<
      PaginatedResponse<OrganizationUserNested>,
      GetOrganizationUsersParams
    >({
      query: ({ orgId, role, page = 1, per_page = 50 }) => ({
        url: `/organizations/${orgId}/users`,
        params: { role, page, per_page },
      }),
      providesTags: (_result, _error, { orgId }) => [
        { type: 'Organizations', id: orgId },
        'OrganizationUsers',
      ],
    }),

    addOrganizationUser: builder.mutation<OrganizationUserNested, AddOrganizationUserParams>({
      query: ({ orgId, ...userData }) => ({
        url: `/organizations/${orgId}/users`,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Organizations', id: orgId },
        'Organizations',
        'OrganizationUsers',
      ],
    }),

    updateOrganizationUser: builder.mutation<OrganizationUserNested, UpdateOrganizationUserParams>({
      query: ({ orgId, userId, ...updates }) => ({
        url: `/organizations/${orgId}/users/${userId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['OrganizationUsers'],
    }),

    removeOrganizationUser: builder.mutation<void, RemoveOrganizationUserParams>({
      query: ({ orgId, userId }) => ({
        url: `/organizations/${orgId}/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OrganizationUsers'],
    }),

    // Organization Invitations endpoints
    getOrganizationInvitations: builder.query<
      PaginatedResponse<OrganizationInvitation>,
      GetOrganizationInvitationsParams
    >({
      query: ({ orgId, page = 1, per_page = 50 }) => ({
        url: `/organizations/${orgId}/invitations`,
        params: { page, per_page },
      }),
      providesTags: ['Organizations'],
    }),

    sendOrganizationInvitation: builder.mutation<
      OrganizationInvitation,
      SendOrganizationInvitationParams
    >({
      query: ({ orgId, ...invitationData }) => ({
        url: `/organizations/${orgId}/invitations`,
        method: 'POST',
        body: invitationData,
      }),
      invalidatesTags: ['Organizations'],
    }),

    bulkSendOrganizationInvitations: builder.mutation<
      BulkInvitationResponse,
      BulkSendOrganizationInvitationsParams
    >({
      query: ({ orgId, invitations }) => ({
        url: `/organizations/${orgId}/invitations/bulk`,
        method: 'POST',
        body: { invitations },
      }),
      invalidatesTags: ['Organizations'],
    }),

    getOrganizationInvitationByToken: builder.query<OrganizationInvitationPreview, string>({
      query: (token) => ({
        url: `/invitations/organization/${token}`,
        method: 'GET',
      }),
    }),

    acceptOrganizationInvitation: builder.mutation<MessageResponse, string>({
      query: (token) => ({
        url: `/invitations/organization/${token}/accept`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Organizations', 'OrganizationUsers', 'Dashboard', 'Invitations'],
    }),

    declineOrganizationInvitation: builder.mutation<MessageResponse, string>({
      query: (token) => ({
        url: `/invitations/organization/${token}/decline`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Organizations'],
    }),

    cancelOrganizationInvitation: builder.mutation<void, CancelOrganizationInvitationParams>({
      query: ({ orgId, invitationId }) => ({
        url: `/organizations/${orgId}/invitations/${invitationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Organizations'],
    }),

    // Mux Credentials endpoints
    updateMuxCredentials: builder.mutation<OrganizationDetail, UpdateMuxCredentialsParams>({
      query: ({ orgId, ...credentials }) => ({
        url: `/organizations/${orgId}/mux-credentials`,
        method: 'PUT',
        body: credentials,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Organizations', id: orgId },
        'Organizations',
      ],
    }),

    deleteMuxCredentials: builder.mutation<OrganizationDetail, number>({
      query: (orgId) => ({
        url: `/organizations/${orgId}/mux-credentials`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, orgId) => [
        { type: 'Organizations', id: orgId },
        'Organizations',
      ],
    }),

    // JaaS Credentials endpoints
    updateJaasCredentials: builder.mutation<OrganizationDetail, UpdateJaasCredentialsParams>({
      query: ({ orgId, ...credentials }) => ({
        url: `/organizations/${orgId}/jaas-credentials`,
        method: 'PUT',
        body: credentials,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Organizations', id: orgId },
        'Organizations',
      ],
    }),

    deleteJaasCredentials: builder.mutation<OrganizationDetail, number>({
      query: (orgId) => ({
        url: `/organizations/${orgId}/jaas-credentials`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, orgId) => [
        { type: 'Organizations', id: orgId },
        'Organizations',
      ],
    }),
  }),
});

export const {
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useGetOrganizationUsersQuery,
  useAddOrganizationUserMutation,
  useUpdateOrganizationUserMutation,
  useRemoveOrganizationUserMutation,
  useGetOrganizationInvitationsQuery,
  useSendOrganizationInvitationMutation,
  useBulkSendOrganizationInvitationsMutation,
  useGetOrganizationInvitationByTokenQuery,
  useAcceptOrganizationInvitationMutation,
  useDeclineOrganizationInvitationMutation,
  useCancelOrganizationInvitationMutation,
  useUpdateMuxCredentialsMutation,
  useDeleteMuxCredentialsMutation,
  useUpdateJaasCredentialsMutation,
  useDeleteJaasCredentialsMutation,
} = organizationsApi;
