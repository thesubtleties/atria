export const ROUTES = {
  ORGANIZATIONS: '/app/organizations',
  EVENTS: '/app/events',
  EVENTS_JOIN: '/app/events/join',
  ORGANIZATION: (orgId) => `/app/organizations/${orgId}`,
  ORGANIZATION_EVENTS: (orgId) => `/app/organizations/${orgId}/events`,
  ORGANIZATION_EVENT: (orgId, eventId) => `/app/organizations/${orgId}/events/${eventId}`,
  ORGANIZATION_EVENT_DASHBOARD: (orgId, eventId) =>
    `/app/organizations/${orgId}/events/${eventId}/admin`,
};
