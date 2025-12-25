import { baseApi } from '../api';
import type {
  User,
  PrivacyAwareUser,
  UserProfileUpdate,
  PrivacySettings,
  EventUserRole,
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

/** User events response - backend returns 'events' not 'items' */
type UserEventsResponse = {
  events: UserEvent[];
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
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
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    company_name: string | null;
    title: string | null;
    bio: string | null;
    image_url: string | null;
    created_at: string;
  };
  stats: {
    events_hosted: number;
    attendees_reached: number;
    connections_made: number;
    events_attended: number;
    organizations_count: number;
  };
  organizations: Array<{
    id: number;
    name: string;
    role: string;
    event_count: number;
    member_count: number;
  }>;
  events: Array<{
    id: number;
    name: string;
    start_date: string;
    end_date: string | null;
    location: string | null;
    status: string; // 'upcoming', 'live', 'past'
    attendee_count: number;
    organization: {
      id: number;
      name: string;
    };
    user_role: string;
  }>;
  connections: Array<{
    id: number;
    user: {
      id: number;
      username: string; // Maps to email
      display_name: string; // Maps to full_name
      avatar_url: string | null; // Maps to image_url
    };
    company: string | null;
    title: string | null;
    connected_at: string;
  }>;
  news: Array<{
    id: number;
    title: string;
    description: string;
    date: string;
    type: string; // 'platform_update', 'product_launch', 'feature_release', 'security'
    is_new: boolean;
    link: string | null;
  }>;
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

/** Privacy overrides for a specific event (the actual override values) */
type EventPrivacyOverrideValues = {
  email_visibility?: string;
  show_public_email?: boolean;
  public_email?: string | null;
  allow_connection_requests?: string;
  show_social_links?: string;
  show_company?: boolean;
  show_bio?: boolean;
};

/** Response from GET /users/{id}/privacy-settings */
type UserPrivacySettingsResponse = {
  privacy_settings: PrivacySettings;
  event_overrides: Array<{
    event_id: number;
    event_name: string | null;
    overrides: EventPrivacyOverrideValues;
  }>;
};

/** Response from GET /users/{userId}/events/{eventId}/privacy-overrides */
type EventPrivacyOverridesResponse = {
  event_id: number;
  user_id: number;
  privacy_overrides: EventPrivacyOverrideValues;
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
type UpdateEventPrivacyOverridesParams = EventPrivacyOverrideValues & {
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
    getUser: builder.query<PrivacyAwareUser, number>({
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

    getUserEvents: builder.query<UserEventsResponse, GetUserEventsParams>({
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

    getUserPrivacySettings: builder.query<UserPrivacySettingsResponse, number>({
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

    getEventPrivacyOverrides: builder.query<EventPrivacyOverridesResponse, GetEventPrivacyOverridesParams>({
      query: ({ userId, eventId }) => ({
        url: `/users/${userId}/events/${eventId}/privacy-overrides`,
      }),
      providesTags: (_result, _error, { userId, eventId }) => [
        { type: 'Users', id: `${userId}-${eventId}` },
      ],
    }),

    updateEventPrivacyOverrides: builder.mutation<
      EventPrivacyOverrideValues,
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
