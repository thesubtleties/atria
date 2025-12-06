import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

/** RTK Query cache tag types used across the app */
export const TAG_TYPES = [
  'Auth',
  'Users',
  'Organizations',
  'OrganizationUsers',
  'Events',
  'EventUsers',
  'Sessions',
  'SessionSpeakers',
  'ChatRoom',
  'ChatMessage',
  'SessionChatRoom',
  'Attendee',
  'Connection',
  'Connections',
  'Thread',
  'DirectMessage',
  'Sponsor',
  'SponsorTiers',
  'Dashboard',
  'ModerationStatus',
] as const;

export type TagType = (typeof TAG_TYPES)[number];

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: axiosBaseQuery,
  // Default cache strategy
  refetchOnReconnect: true, // Refetch when network reconnects
  keepUnusedDataFor: 300, // Keep cache for 5 minutes after component unmounts
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});

