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
    'Attendee',
    'Connection',
    'Thread',
    'DirectMessage',
    'Sponsor',
    'SponsorTiers',
  ],
  endpoints: () => ({}),
});
