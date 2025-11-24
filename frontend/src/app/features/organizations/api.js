import { baseApi } from '../api';

export const organizationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizations: builder.query({
      query: () => ({
        url: '/organizations',
      }),
      providesTags: ['Organizations'],
    }),
    getOrganization: builder.query({
      query: (id) => ({
        url: `/organizations/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Organizations', id }],
      // Organizations rarely change, keep cache longer
      keepUnusedDataFor: 600,
    }),
    createOrganization: builder.mutation({
      query: (orgData) => ({
        url: '/organizations',
        method: 'POST',
        body: orgData,
      }),
      invalidatesTags: ['Organizations'],
    }),
    updateOrganization: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/organizations/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Organizations', id },
        'Organizations',
      ],
    }),
    deleteOrganization: builder.mutation({
      query: (id) => ({
        url: `/organizations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Organizations'],
    }),
    // Organization Users endpoints
    getOrganizationUsers: builder.query({
      query: ({ orgId, role, page = 1, per_page = 50 }) => ({
        url: `/organizations/${orgId}/users`,
        params: { role, page, per_page },
      }),
      providesTags: (result, error, { orgId }) => [
        { type: 'Organizations', id: orgId },
        'OrganizationUsers',
      ],
    }),
    addOrganizationUser: builder.mutation({
      query: ({ orgId, ...userData }) => ({
        url: `/organizations/${orgId}/users`,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: 'Organizations', id: orgId },
        'Organizations',
        'OrganizationUsers',
      ],
    }),
    updateOrganizationUser: builder.mutation({
      query: ({ orgId, userId, ...updates }) => ({
        url: `/organizations/${orgId}/users/${userId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['OrganizationUsers'],
    }),
    removeOrganizationUser: builder.mutation({
      query: ({ orgId, userId }) => ({
        url: `/organizations/${orgId}/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OrganizationUsers'],
    }),
    // Organization Invitations endpoints
    getOrganizationInvitations: builder.query({
      query: ({ orgId, page = 1, per_page = 50 }) => ({
        url: `/organizations/${orgId}/invitations`,
        params: { page, per_page },
      }),
      providesTags: ['OrganizationInvitations'],
    }),
    sendOrganizationInvitation: builder.mutation({
      query: ({ orgId, ...invitationData }) => ({
        url: `/organizations/${orgId}/invitations`,
        method: 'POST',
        body: invitationData,
      }),
      invalidatesTags: ['OrganizationInvitations'],
    }),
    bulkSendOrganizationInvitations: builder.mutation({
      query: ({ orgId, invitations }) => ({
        url: `/organizations/${orgId}/invitations/bulk`,
        method: 'POST',
        body: { invitations },
      }),
      invalidatesTags: ['OrganizationInvitations'],
    }),
    getOrganizationInvitationByToken: builder.query({
      query: (token) => `/invitations/organization/${token}`,
    }),
    acceptOrganizationInvitation: builder.mutation({
      query: (token) => ({
        url: `/invitations/organization/${token}/accept`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Organizations', 'OrganizationUsers', 'Invitations', 'Dashboard'],
    }),
    declineOrganizationInvitation: builder.mutation({
      query: (token) => ({
        url: `/invitations/organization/${token}/decline`,
        method: 'POST',
      }),
      invalidatesTags: ['Invitations'],
    }),
    cancelOrganizationInvitation: builder.mutation({
      query: ({ orgId, invitationId }) => ({
        url: `/organizations/${orgId}/invitations/${invitationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OrganizationInvitations'],
    }),
    // Mux Credentials endpoints
    updateMuxCredentials: builder.mutation({
      query: ({ orgId, ...credentials }) => ({
        url: `/organizations/${orgId}/mux-credentials`,
        method: 'PUT',
        body: credentials,
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: 'Organizations', id: orgId },
        'Organizations',
      ],
    }),
    deleteMuxCredentials: builder.mutation({
      query: (orgId) => ({
        url: `/organizations/${orgId}/mux-credentials`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, orgId) => [
        { type: 'Organizations', id: orgId },
        'Organizations',
      ],
    }),
    // JaaS Credentials endpoints
    updateJaasCredentials: builder.mutation({
      query: ({ orgId, ...credentials }) => ({
        url: `/organizations/${orgId}/jaas-credentials`,
        method: 'PUT',
        body: credentials,
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: 'Organizations', id: orgId },
        'Organizations',
      ],
    }),
    deleteJaasCredentials: builder.mutation({
      query: (orgId) => ({
        url: `/organizations/${orgId}/jaas-credentials`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, orgId) => [
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
