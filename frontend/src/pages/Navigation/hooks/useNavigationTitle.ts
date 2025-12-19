import { useLocation, useParams } from 'react-router-dom';
import { useGetEventQuery } from '@/app/features/events/api';
import { ROUTES } from '../constants/routes';

type TitleData = {
  text: string;
};

type UseNavigationTitleResult = {
  titleData: TitleData | null;
  isLoading: boolean;
};

export const useNavigationTitle = (): UseNavigationTitleResult => {
  const location = useLocation();
  const { eventId } = useParams<{ eventId: string }>();

  const needsEventData = location.pathname.includes(`/events/${eventId}`);

  const { data: event, isLoading: isLoadingEvent } = useGetEventQuery(
    { id: Number(eventId) },
    {
      skip: !needsEventData || !eventId,
    },
  );

  const getTitle = (): TitleData | null => {
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
    isLoading: needsEventData && isLoadingEvent,
  };
};
