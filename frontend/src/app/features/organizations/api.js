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
      providesTags: ['OrganizationUsers'],
    }),
    addOrganizationUser: builder.mutation({
      query: ({ orgId, ...userData }) => ({
        url: `/organizations/${orgId}/users`,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['OrganizationUsers'],
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
} = organizationsApi;
