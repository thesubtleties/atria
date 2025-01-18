import { useLocation, useParams } from 'react-router-dom';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import { useGetEventQuery } from '@/app/features/events/api';
import { ROUTES } from '../constants/routes';

// src/pages/Navigation/hooks/useNavigationTitle.js
export const useNavigationTitle = () => {
  const location = useLocation();
  const { orgId, eventId } = useParams();

  // Check if we're on a route that needs data
  const needsOrgData = location.pathname.includes(`/organizations/${orgId}`);
  const needsEventData = location.pathname.includes(`/events/${eventId}`);

  const { data: organization, isLoading: isLoadingOrg } =
    useGetOrganizationQuery(orgId, {
      skip: !needsOrgData || !orgId,
    });

  const { data: event, isLoading: isLoadingEvent } = useGetEventQuery(eventId, {
    skip: !needsEventData || !eventId,
  });

  const getTitle = () => {
    // Simple routes - no API calls needed
    switch (location.pathname) {
      case ROUTES.ORGANIZATIONS:
        return { text: 'Organizations' };
      case ROUTES.EVENTS:
        return { text: 'Events' };
      case ROUTES.EVENTS_JOIN:
        return { text: 'Join Event' };
    }

    // Only check org/event routes if we need the data
    if (needsOrgData && organization) {
      if (location.pathname === ROUTES.ORGANIZATION(orgId)) {
        return { text: organization.name };
      }

      if (location.pathname === ROUTES.ORGANIZATION_EVENTS(orgId)) {
        return { text: `${organization.name} - Events` };
      }
    }

    if (needsEventData && event) {
      return needsOrgData
        ? { text: event.name, subtitle: 'Organizer View' }
        : { text: event.name };
    }

    return null;
  };

  return {
    titleData: getTitle(),
    isLoading:
      (needsOrgData && isLoadingOrg) || (needsEventData && isLoadingEvent),
  };
};
