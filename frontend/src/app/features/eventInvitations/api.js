import { baseApi } from '../api';

export const eventInvitationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get pending invitations for an event
    getEventInvitations: builder.query({
      query: ({ eventId, page = 1, perPage = 50 }) => ({
        url: `/events/${eventId}/invitations`,
        params: { page, per_page: perPage },
      }),
      providesTags: ['EventInvitations'],
      // Invitations change frequently during setup, refetch if older than 1 min
      refetchOnMountOrArgChange: 60,
    }),

    // Send single invitation
    sendEventInvitation: builder.mutation({
      query: ({ eventId, ...invitationData }) => ({
        url: `/events/${eventId}/invitations`,
        method: 'POST',
        body: invitationData,
      }),
      invalidatesTags: ['EventInvitations'],
    }),

    // Send bulk invitations
    sendBulkEventInvitations: builder.mutation({
      query: ({ eventId, invitations }) => ({
        url: `/events/${eventId}/invitations/bulk`,
        method: 'POST',
        body: { invitations },
      }),
      invalidatesTags: ['EventInvitations'],
    }),

    // Accept invitation
    acceptInvitation: builder.mutation({
      query: ({ token }) => ({
        url: `/invitations/${token}/accept`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['EventUsers', 'Events', 'Invitations', 'Dashboard'],
    }),

    // Decline invitation
    declineInvitation: builder.mutation({
      query: ({ token }) => ({
        url: `/invitations/${token}/decline`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Invitations'],
    }),

    // Cancel invitation
    cancelEventInvitation: builder.mutation({
      query: (invitationId) => ({
        url: `/invitations/${invitationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['EventInvitations'],
    }),
  }),
});

export const {
  useGetEventInvitationsQuery,
  useSendEventInvitationMutation,
  useSendBulkEventInvitationsMutation,
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useCancelEventInvitationMutation,
} = eventInvitationsApi;