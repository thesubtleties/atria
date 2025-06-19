import { baseApi } from '../api';

export const attendeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all attendees for an event
    getEventAttendees: builder.query({
      query: (eventId) => `/events/${eventId}/attendees`,
      providesTags: ['Attendee']
    }),

    // Get a specific attendee profile
    getAttendeeProfile: builder.query({
      query: ({ eventId, attendeeId }) => `/events/${eventId}/attendees/${attendeeId}`,
      providesTags: ['Attendee']
    }),

    // Send connection request
    connectAttendee: builder.mutation({
      query: ({ eventId, attendeeId, message }) => ({
        url: `/events/${eventId}/attendees/${attendeeId}/connect`,
        method: 'POST',
        body: { message }
      }),
      invalidatesTags: ['Attendee', 'Connection']
    }),

    // Accept connection request
    acceptConnection: builder.mutation({
      query: ({ eventId, connectionId }) => ({
        url: `/events/${eventId}/connections/${connectionId}/accept`,
        method: 'POST'
      }),
      invalidatesTags: ['Connection', 'Attendee']
    }),

    // Reject connection request
    rejectConnection: builder.mutation({
      query: ({ eventId, connectionId }) => ({
        url: `/events/${eventId}/connections/${connectionId}/reject`,
        method: 'POST'
      }),
      invalidatesTags: ['Connection']
    }),

    // Get connections for current user
    getMyConnections: builder.query({
      query: (eventId) => `/events/${eventId}/my-connections`,
      providesTags: ['Connection']
    }),

    // Update privacy settings
    updatePrivacySettings: builder.mutation({
      query: ({ eventId, settings }) => ({
        url: `/events/${eventId}/my-profile/privacy`,
        method: 'PATCH',
        body: settings
      }),
      invalidatesTags: ['Attendee']
    })
  })
});

export const {
  useGetEventAttendeesQuery,
  useGetAttendeeProfileQuery,
  useConnectAttendeeMutation,
  useAcceptConnectionMutation,
  useRejectConnectionMutation,
  useGetMyConnectionsQuery,
  useUpdatePrivacySettingsMutation
} = attendeesApi;