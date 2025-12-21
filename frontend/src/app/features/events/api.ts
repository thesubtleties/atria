import { baseApi } from '../api';
import type {
  Event,
  EventCreateData,
  EventUpdateData,
  EventBrandingUpdate,
  EventUser,
} from '@/types';

interface GetEventsParams {
  orgId: number;
  page?: number;
  per_page?: number;
}

interface GetEventsResponse {
  events: Event[];
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  self?: string;
  first?: string;
  last?: string;
  next?: string;
  prev?: string;
}

interface GetEventParams {
  id: number;
}

/** Create event params - org ID plus event data */
type CreateEventParams = { orgId: number } & EventCreateData;

/** Update event params - event ID plus update data */
type UpdateEventParams = { id: number } & EventUpdateData;

/** Update event branding params */
type UpdateEventBrandingParams = { id: number } & EventBrandingUpdate;

interface GetEventUsersParams {
  eventId: number;
  role?: string;
  page?: number;
  per_page?: number;
}

interface GetEventUsersResponse {
  users: EventUser[];
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  self?: string;
  first?: string;
  last?: string;
  next?: string;
  prev?: string;
}

interface AddEventUserParams {
  eventId: number;
  user_id: number;
  role: string;
}

/** Add or create event user */
interface AddOrCreateEventUserParams {
  eventId: number;
  email: string;
  first_name: string;
  last_name: string;
  password?: string | undefined; // Optional - used only for new user creation
  role: string;
}

interface UpdateEventUserParams {
  eventId: number;
  userId: number;
  role?: string;
}

interface UpdateEventSpeakerInfoParams {
  eventId: number;
  userId: number;
  speaker_bio?: string;
  speaker_title?: string;
  speaker_company?: string;
}

interface RemoveEventUserParams {
  eventId: number;
  userId: number;
}

interface DeleteEventParams {
  id: number;
}

export const eventsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query<GetEventsResponse, GetEventsParams>({
      query: ({ orgId, page = 1, per_page = 50 }) => ({
        url: `/organizations/${orgId}/events`,
        params: { page, per_page },
      }),
      providesTags: ['Events'],
    }),
    getEvent: builder.query<Event, GetEventParams>({
      query: ({ id }) => ({
        url: `/events/${id}`,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'Events' as const, id }],
    }),
    createEvent: builder.mutation<Event, CreateEventParams>({
      query: ({ orgId, ...eventData }) => ({
        url: `/organizations/${orgId}/events`,
        method: 'POST',
        body: eventData,
      }),
      invalidatesTags: ['Events'],
    }),
    deleteEvent: builder.mutation<void, DeleteEventParams>({
      query: ({ id }) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Events'],
    }),
    updateEvent: builder.mutation<Event, UpdateEventParams>({
      query: ({ id, ...updates }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Events' as const, id }, 'Events'],
    }),
    updateEventBranding: builder.mutation<void, UpdateEventBrandingParams>({
      query: ({ id, ...branding }) => ({
        url: `/events/${id}/branding`,
        method: 'PUT',
        body: branding,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Events' as const, id }],
    }),
    getEventUsers: builder.query<GetEventUsersResponse, GetEventUsersParams>({
      query: ({ eventId, role, page = 1, per_page = 50 }) => ({
        url: `/events/${eventId}/users`,
        params: { role, page, per_page },
      }),
      providesTags: ['EventUsers'],
    }),
    getEventUsersAdmin: builder.query<GetEventUsersResponse, GetEventUsersParams>({
      query: ({ eventId, role, page = 1, per_page = 50 }) => ({
        url: `/events/${eventId}/users/admin`,
        params: { role, page, per_page },
      }),
      providesTags: ['EventUsers'],
    }),
    addEventUser: builder.mutation<void, AddEventUserParams>({
      query: ({ eventId, ...userData }) => ({
        url: `/events/${eventId}/users`,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['EventUsers'],
    }),
    addOrCreateEventUser: builder.mutation<void, AddOrCreateEventUserParams>({
      query: ({ eventId, ...userData }) => ({
        url: `/events/${eventId}/users/add`,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['EventUsers'],
    }),
    updateEventUser: builder.mutation<void, UpdateEventUserParams>({
      query: ({ eventId, userId, ...updates }) => ({
        url: `/events/${eventId}/users/${userId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['EventUsers'],
    }),
    updateEventSpeakerInfo: builder.mutation<void, UpdateEventSpeakerInfoParams>({
      query: ({ eventId, userId, ...info }) => ({
        url: `/events/${eventId}/users/${userId}/speaker-info`,
        method: 'PUT',
        body: info,
      }),
      invalidatesTags: ['EventUsers'],
    }),
    removeEventUser: builder.mutation<void, RemoveEventUserParams>({
      query: ({ eventId, userId }) => ({
        url: `/events/${eventId}/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['EventUsers'],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useUpdateEventBrandingMutation,
  useGetEventUsersQuery,
  useGetEventUsersAdminQuery,
  useAddEventUserMutation,
  useUpdateEventUserMutation,
  useUpdateEventSpeakerInfoMutation,
  useDeleteEventMutation,
  useAddOrCreateEventUserMutation,
  useRemoveEventUserMutation,
} = eventsApi;
