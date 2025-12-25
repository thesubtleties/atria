export const ROUTES = {
  ORGANIZATIONS: '/app/organizations',
  EVENTS: '/app/events',
  EVENTS_JOIN: '/app/events/join',
  ORGANIZATION: (orgId: string | number) => `/app/organizations/${orgId}`,
  ORGANIZATION_EVENTS: (orgId: string | number) => `/app/organizations/${orgId}/events`,
  ORGANIZATION_EVENT: (orgId: string | number, eventId: string | number) =>
    `/app/organizations/${orgId}/events/${eventId}`,
  ORGANIZATION_EVENT_DASHBOARD: (orgId: string | number, eventId: string | number) =>
    `/app/organizations/${orgId}/events/${eventId}/admin`,
} as const;
