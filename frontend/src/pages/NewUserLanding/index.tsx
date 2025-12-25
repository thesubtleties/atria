import { useGetOrganizationsQuery } from '@/app/features/organizations/api';
import { useGetUserEventsQuery } from '@/app/features/users/api';
import { useSelector } from 'react-redux';
import { NewUserLanding } from './NewUserLanding';
import { Navigate } from 'react-router-dom';
import type { RootState } from '@/app/store';

export const NewUserCheck = () => {
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  const {
    data: { organizations = [] } = {}, // Nested destructuring with defaults
    isLoading: orgsLoading,
  } = useGetOrganizationsQuery();

  const { data: eventsData, isLoading: eventsLoading } = useGetUserEventsQuery(
    { userId: userId as number },
    { skip: !userId },
  );

  const events = eventsData?.events ?? [];

  if (orgsLoading || eventsLoading) {
    return null;
  }

  if (organizations.length > 0 || events.length > 0) {
    return <Navigate to='/app/dashboard' replace />;
  }

  return <NewUserLanding />;
};
