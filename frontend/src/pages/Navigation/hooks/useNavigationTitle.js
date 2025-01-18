import { useLocation, useParams } from 'react-router-dom';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import { useGetEventQuery } from '@/app/features/events/api';
import { ROUTES } from '../constants/routes';

export const useNavigationTitle = () => {
  const location = useLocation();
  const { orgId, eventId } = useParams();

  const { data: organization, isLoading: isLoadingOrg } =
    useGetOrganizationQuery(orgId, {
      skip: !orgId,
    });

  const { data: event, isLoading: isLoadingEvent } = useGetEventQuery(eventId, {
    skip: !eventId,
  });

  const getTitle = () => {
    // Root routes
    switch (location.pathname) {
      case ROUTES.ORGANIZATIONS:
        return { text: 'Organizations' };
      case ROUTES.EVENTS:
        return { text: 'Events' };
      case ROUTES.EVENTS_JOIN:
        return { text: 'Join Event' };
    }

    // Organization routes
    if (orgId) {
      if (location.pathname === ROUTES.ORGANIZATION(orgId)) {
        return { text: organization?.name || 'Organization' };
      }

      if (location.pathname === ROUTES.ORGANIZATION_EVENTS(orgId)) {
        return { text: 'Events' };
      }

      if (eventId && event) {
        return {
          text: event.name,
          subtitle: 'Organizer View',
        };
      }
    }

    return null;
  };

  return {
    titleData: getTitle(),
    isLoading: isLoadingOrg || isLoadingEvent,
  };
};
