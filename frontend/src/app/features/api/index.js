import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

export const baseApi = createApi({
  baseQuery: axiosBaseQuery,
  // Default cache strategy
  refetchOnReconnect: true, // Refetch when network reconnects
  keepUnusedDataFor: 300, // Keep cache for 5 minutes after component unmounts
  tagTypes: [
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
  ],
  endpoints: () => ({}),
});
