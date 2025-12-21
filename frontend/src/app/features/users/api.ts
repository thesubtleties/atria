import { baseApi } from '../api';
import type {
  User,
  UserDetail,
  UserProfileUpdate,
  PrivacySettings,
  EventUserRole,
  PaginatedResponse,
} from '@/types';

/** User basic info (from UserCheckResponse) */
type UserBasicInfo = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
};

/** User exists check response */
type UserExistsResponse = {
  user: UserBasicInfo | null;
};

/** Get user events params */
type GetUserEventsParams = {
  userId: number;
  role?: EventUserRole;
  page?: number;
  per_page?: number;
};

/** User event summary */
type UserEvent = {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  role: EventUserRole;
  status: string;
};

/** User speaking session */
type UserSpeakingSession = {
  id: number;
  title: string;
  event_id: number;
  event_title: string;
  start_time: string;
  day_number: number;
};

/** User dashboard data */
type UserDashboard = {
  organizations: Array<{
    id: number;
    name: string;
    role: string;
  }>;
  upcoming_events: Array<{
    id: number;
    title: string;
    start_date: string;
    role: EventUserRole;
  }>;
  pending_invitations: number;
  pending_connections: number;
};

/** User invitations summary */
type UserInvitations = {
  organization_invitations: Array<{
    id: number;
    organization_name: string;
    role: string;
    status: string;
    token: string;
  }>;
  event_invitations: Array<{
    id: number;
    event_title: string;
    role: EventUserRole;
    status: string;
    token: string;
  }>;
};

/** Privacy overrides for a specific event */
type EventPrivacyOverrides = {
  email_visibility?: string;
  show_public_email?: boolean;
  public_email?: string | null;
  allow_connection_requests?: string;
  show_social_links?: string;
  show_company?: boolean;
  show_bio?: boolean;
};

/** Update user params */
type UpdateUserParams = UserProfileUpdate & {
  id: number;
};

/** Update privacy settings params */
type UpdatePrivacySettingsParams = Partial<PrivacySettings> & {
  id: number;
};

/** Get event privacy overrides params */
type GetEventPrivacyOverridesParams = {
  userId: number;
  eventId: number;
};

/** Update event privacy overrides params */
type UpdateEventPrivacyOverridesParams = EventPrivacyOverrides & {
  userId: number;
  eventId: number;
};

/** Delete event privacy overrides params */
type DeleteEventPrivacyOverridesParams = {
  userId: number;
  eventId: number;
};

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query<UserDetail, number>({
      query: (id) => ({
        url: `/users/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Users', id }],
      // User profiles rarely change, keep cache longer
      keepUnusedDataFor: 600,
    }),

    checkUserExists: builder.query<UserExistsResponse, string>({
      query: (email) => ({
        url: `/users/check-email?email=${encodeURIComponent(email)}`,
        method: 'GET',
      }),
      providesTags: ['Users'],
    }),

    updateUser: builder.mutation<User, UpdateUserParams>({
      query: ({ id, ...updates }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Users', id },
        { type: 'Dashboard', id },
        'EventUsers', // Invalidate attendee lists to show updated profile
        'ChatMessage', // Invalidate chat messages to show updated avatar
        'SessionSpeakers', // Invalidate speaker lists to show updated info
      ],
    }),

    getUserEvents: builder.query<PaginatedResponse<UserEvent>, GetUserEventsParams>({
      query: ({ userId, role, page = 1, per_page = 50 }) => ({
        url: `/users/${userId}/events`,
        params: { role, page, per_page },
      }),
      providesTags: ['Events'],
    }),

    getUserSpeakingSessions: builder.query<UserSpeakingSession[], number>({
      query: (userId) => ({
        url: `/users/${userId}/speaking-sessions`,
      }),
      providesTags: ['Sessions'],
    }),

    getUserDashboard: builder.query<UserDashboard, number>({
      query: (userId) => ({
        url: `/users/${userId}/dashboard`,
      }),
      providesTags: (_result, _error, userId) => [
        { type: 'Dashboard', id: userId },
        'Organizations',
        'Events',
        'Connections',
      ],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    getUserInvitations: builder.query<UserInvitations, number>({
      query: (userId) => ({
        url: `/users/${userId}/invitations`,
      }),
      providesTags: ['Organizations'],
    }),

    getUserPrivacySettings: builder.query<PrivacySettings, number>({
      query: (id) => ({ url: `/users/${id}/privacy-settings` }),
      providesTags: (_result, _error, id) => [{ type: 'Users', id }],
    }),

    updateUserPrivacySettings: builder.mutation<PrivacySettings, UpdatePrivacySettingsParams>({
      query: ({ id, ...settings }) => ({
        url: `/users/${id}/privacy-settings`,
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Users', id },
        'EventUsers', // Refresh attendee lists as privacy affects visibility
      ],
    }),

    getEventPrivacyOverrides: builder.query<EventPrivacyOverrides, GetEventPrivacyOverridesParams>({
      query: ({ userId, eventId }) => ({
        url: `/users/${userId}/events/${eventId}/privacy-overrides`,
      }),
      providesTags: (_result, _error, { userId, eventId }) => [
        { type: 'Users', id: `${userId}-${eventId}` },
      ],
    }),

    updateEventPrivacyOverrides: builder.mutation<
      EventPrivacyOverrides,
      UpdateEventPrivacyOverridesParams
    >({
      query: ({ userId, eventId, ...overrides }) => ({
        url: `/users/${userId}/events/${eventId}/privacy-overrides`,
        method: 'PUT',
        body: overrides,
      }),
      invalidatesTags: (_result, _error, { userId, eventId }) => [
        { type: 'Users', id: `${userId}-${eventId}` },
        { type: 'Users', id: userId },
        'EventUsers', // Refresh attendee lists as privacy affects visibility
      ],
    }),

    deleteEventPrivacyOverrides: builder.mutation<void, DeleteEventPrivacyOverridesParams>({
      query: ({ userId, eventId }) => ({
        url: `/users/${userId}/events/${eventId}/privacy-overrides`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { userId, eventId }) => [
        { type: 'Users', id: `${userId}-${eventId}` },
        { type: 'Users', id: userId },
        'EventUsers',
      ],
    }),
  }),
});

export const {
  useGetUserQuery,
  useCheckUserExistsQuery,
  useUpdateUserMutation,
  useGetUserEventsQuery,
  useGetUserSpeakingSessionsQuery,
  useGetUserDashboardQuery,
  useGetUserInvitationsQuery,
  useGetUserPrivacySettingsQuery,
  useUpdateUserPrivacySettingsMutation,
  useGetEventPrivacyOverridesQuery,
  useUpdateEventPrivacyOverridesMutation,
  useDeleteEventPrivacyOverridesMutation,
} = usersApi;
