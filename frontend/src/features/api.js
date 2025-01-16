// src/features/api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const baseApi = createApi({
  baseQuery: async ({ url, method = 'GET', body, params }) => {
    try {
      const result = await api({
        url,
        method,
        data: body,
        params,
      });
      return { data: result.data };
    } catch (error) {
      return { error };
    }
  },
  tagTypes: [
    'Auth',
    'Users',
    'Organizations',
    'OrganizationUsers',
    'Events',
    'EventUsers',
    'Sessions',
    'SessionSpeakers',
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    signup: builder.mutation({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
    }),
    refresh: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    // Users endpoints
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Users', id }],
    }),
    getUserEvents: builder.query({
      query: ({ userId, role, page = 1, per_page = 50 }) => ({
        url: `/users/${userId}/events`,
        params: { role, page, per_page },
      }),
      providesTags: ['Events'],
    }),
    getUserSpeakingSessions: builder.query({
      query: (userId) => `/users/${userId}/speaking-sessions`,
      providesTags: ['Sessions'],
    }),

    // Organizations endpoints
    getOrganizations: builder.query({
      query: () => '/organizations',
      providesTags: ['Organizations'],
    }),
    getOrganization: builder.query({
      query: (id) => `/organizations/${id}`,
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

    // Events endpoints
    getEvents: builder.query({
      query: ({ orgId, page = 1, per_page = 50 }) => ({
        url: `/organizations/${orgId}/events`,
        params: { page, per_page },
      }),
      providesTags: ['Events'],
    }),
    getEvent: builder.query({
      query: (id) => `/events/${id}`,
      providesTags: (result, error, id) => [{ type: 'Events', id }],
    }),
    createEvent: builder.mutation({
      query: ({ orgId, ...eventData }) => ({
        url: `/organizations/${orgId}/events`,
        method: 'POST',
        body: eventData,
      }),
      invalidatesTags: ['Events'],
    }),
    updateEvent: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Events', id }],
    }),
    updateEventBranding: builder.mutation({
      query: ({ id, ...branding }) => ({
        url: `/events/${id}/branding`,
        method: 'PUT',
        body: branding,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Events', id }],
    }),

    // Event Users endpoints
    getEventUsers: builder.query({
      query: ({ eventId, role, page = 1, per_page = 50 }) => ({
        url: `/events/${eventId}/users`,
        params: { role, page, per_page },
      }),
      providesTags: ['EventUsers'],
    }),
    addEventUser: builder.mutation({
      query: ({ eventId, ...userData }) => ({
        url: `/events/${eventId}/users`,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['EventUsers'],
    }),
    updateEventUser: builder.mutation({
      query: ({ eventId, userId, ...updates }) => ({
        url: `/events/${eventId}/users/${userId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['EventUsers'],
    }),
    updateEventSpeakerInfo: builder.mutation({
      query: ({ eventId, userId, ...info }) => ({
        url: `/events/${eventId}/users/${userId}/speaker-info`,
        method: 'PUT',
        body: info,
      }),
      invalidatesTags: ['EventUsers'],
    }),

    // Sessions endpoints
    getSessions: builder.query({
      query: ({ eventId, dayNumber, page = 1, per_page = 50 }) => ({
        url: `/events/${eventId}/sessions`,
        params: { day_number: dayNumber, page, per_page },
      }),
      providesTags: ['Sessions'],
    }),
    getSession: builder.query({
      query: (id) => `/sessions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Sessions', id }],
    }),
    createSession: builder.mutation({
      query: ({ eventId, ...sessionData }) => ({
        url: `/events/${eventId}/sessions`,
        method: 'POST',
        body: sessionData,
      }),
      invalidatesTags: ['Sessions'],
    }),
    updateSession: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/sessions/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sessions', id }],
    }),
    updateSessionStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/sessions/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sessions', id }],
    }),
    updateSessionTimes: builder.mutation({
      query: ({ id, ...times }) => ({
        url: `/sessions/${id}/times`,
        method: 'PUT',
        body: times,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sessions', id }],
    }),

    // Session Speakers endpoints
    getSessionSpeakers: builder.query({
      query: ({ sessionId, role, page = 1, per_page = 50 }) => ({
        url: `/sessions/${sessionId}/speakers`,
        params: { role, page, per_page },
      }),
      providesTags: ['SessionSpeakers'],
    }),
    addSessionSpeaker: builder.mutation({
      query: ({ sessionId, ...speakerData }) => ({
        url: `/sessions/${sessionId}/speakers`,
        method: 'POST',
        body: speakerData,
      }),
      invalidatesTags: ['SessionSpeakers'],
    }),
    updateSessionSpeaker: builder.mutation({
      query: ({ sessionId, userId, ...updates }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['SessionSpeakers'],
    }),
    reorderSessionSpeaker: builder.mutation({
      query: ({ sessionId, userId, order }) => ({
        url: `/sessions/${sessionId}/speakers/${userId}/reorder`,
        method: 'PUT',
        body: { order },
      }),
      invalidatesTags: ['SessionSpeakers'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Auth
  useLoginMutation,
  useSignupMutation,
  useRefreshMutation,
  useLogoutMutation,

  // Users
  useGetUserQuery,
  useUpdateUserMutation,
  useGetUserEventsQuery,
  useGetUserSpeakingSessionsQuery,

  // Organizations
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,

  // Organization Users
  useGetOrganizationUsersQuery,
  useAddOrganizationUserMutation,
  useUpdateOrganizationUserMutation,
  useRemoveOrganizationUserMutation,

  // Events
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useUpdateEventBrandingMutation,

  // Event Users
  useGetEventUsersQuery,
  useAddEventUserMutation,
  useUpdateEventUserMutation,
  useUpdateEventSpeakerInfoMutation,

  // Sessions
  useGetSessionsQuery,
  useGetSessionQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useUpdateSessionStatusMutation,
  useUpdateSessionTimesMutation,

  // Session Speakers
  useGetSessionSpeakersQuery,
  useAddSessionSpeakerMutation,
  useUpdateSessionSpeakerMutation,
  useReorderSessionSpeakerMutation,
} = baseApi;
