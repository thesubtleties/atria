import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

export const baseApi = createApi({
  baseQuery: axiosBaseQuery,
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
