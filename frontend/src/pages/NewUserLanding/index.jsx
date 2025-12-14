// src/pages/NewUserLanding/index.jsx
import { useGetOrganizationsQuery } from '@/app/features/organizations/api';
import { useGetUserEventsQuery } from '@/app/features/users/api';
import { useSelector } from 'react-redux';
import { NewUserLanding } from './NewUserLanding';
import { Navigate } from 'react-router-dom';

export const NewUserCheck = () => {
  const userId = useSelector((state) => state.auth.user?.id);

  const {
    data: { organizations = [] } = {}, // Nested destructuring with defaults
    isLoading: orgsLoading,
  } = useGetOrganizationsQuery();

  const {
    data: { events = [] } = {}, // Assuming similar structure for events
    isLoading: eventsLoading,
  } = useGetUserEventsQuery({ userId }, { skip: !userId });

  if (orgsLoading || eventsLoading) {
    return null;
  }

  if (organizations.length > 0 || events.length > 0) {
    return <Navigate to='/app/dashboard' replace />;
  }

  return <NewUserLanding />;
};
