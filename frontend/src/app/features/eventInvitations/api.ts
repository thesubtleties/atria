import { baseApi } from '../api';

type GetEventInvitationsParams = {
  eventId: number;
  page?: number;
  perPage?: number;
};

type EventInvitation = {
  id: number;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
};

type GetEventInvitationsResponse = {
  invitations: EventInvitation[];
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

type SendEventInvitationParams = {
  eventId: number;
  email: string;
  role: string;
  message?: string;
};

type SendBulkEventInvitationsParams = {
  eventId: number;
  invitations: Array<{
    email: string;
    role: string;
    message?: string;
  }>;
};

type AcceptInvitationParams = {
  token: string;
};

type DeclineInvitationParams = {
  token: string;
};

type CancelEventInvitationParams = {
  invitationId: number;
};

export const eventInvitationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEventInvitations: builder.query<GetEventInvitationsResponse, GetEventInvitationsParams>({
      query: ({ eventId, page = 1, perPage = 50 }) => ({
        url: `/events/${eventId}/invitations`,
        params: { page, per_page: perPage },
      }),
      providesTags: ['EventInvitations'],
    }),

    sendEventInvitation: builder.mutation<void, SendEventInvitationParams>({
      query: ({ eventId, ...invitationData }) => ({
        url: `/events/${eventId}/invitations`,
        method: 'POST',
        body: invitationData,
      }),
      invalidatesTags: ['EventInvitations'],
    }),

    sendBulkEventInvitations: builder.mutation<void, SendBulkEventInvitationsParams>({
      query: ({ eventId, invitations }) => ({
        url: `/events/${eventId}/invitations/bulk`,
        method: 'POST',
        body: { invitations },
      }),
      invalidatesTags: ['EventInvitations'],
    }),

    acceptInvitation: builder.mutation<void, AcceptInvitationParams>({
      query: ({ token }) => ({
        url: `/invitations/${token}/accept`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['EventUsers', 'Events', 'Invitations', 'Dashboard'],
    }),

    declineInvitation: builder.mutation<void, DeclineInvitationParams>({
      query: ({ token }) => ({
        url: `/invitations/${token}/decline`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Invitations'],
    }),

    cancelEventInvitation: builder.mutation<void, CancelEventInvitationParams>({
      query: ({ invitationId }) => ({
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
