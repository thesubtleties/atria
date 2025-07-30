import { useLocation, useParams } from 'react-router-dom';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import { useGetEventQuery } from '@/app/features/events/api';
import { ROUTES } from '../constants/routes';

// src/pages/Navigation/hooks/useNavigationTitle.js
export const useNavigationTitle = () => {
  const location = useLocation();
  const { orgId, eventId } = useParams();

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
    // Only show titles for event-related pages
    if (location.pathname === ROUTES.EVENTS_JOIN) {
      return { text: 'Join Event' };
    }

    // Only show event title when inside an event
    if (needsEventData && event) {
      return { text: event.title };
    }

    // Don't show any titles for organization pages, dashboard, or other pages
    return null;
  };

  return {
    titleData: getTitle(),
    isLoading:
      (needsOrgData && isLoadingOrg) || (needsEventData && isLoadingEvent),
  };
};
