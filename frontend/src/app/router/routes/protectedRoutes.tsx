import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Outlet, Navigate } from 'react-router-dom';
import { AuthGuard } from '../guards/AuthGuard';

// Eagerly load only the core layout
import { AppLayout } from '../layouts/AppLayout';

// Lazy load all protected pages for optimal bundle splitting
const NewUserCheck = lazy(() =>
  import('../../../pages/NewUserLanding').then((module) => ({
    default: module.NewUserCheck,
  })),
);
const CreateOrganization = lazy(() =>
  import('../../../pages/Organizations/CreateOrganization').then((module) => ({
    default: module.CreateOrganization,
  })),
);
const EventsList = lazy(() =>
  import('../../../pages/Events/EventsList').then((module) => ({
    default: module.EventsList,
  })),
);
const SetupSession = lazy(() =>
  import('../../../pages/Session/SetupSession').then((module) => ({
    default: module.SetupSession,
  })),
);
const SessionPage = lazy(() =>
  import('../../../pages/Session').then((module) => ({
    default: module.SessionPage,
  })),
);
const AgendaPage = lazy(() =>
  import('../../../pages/Agenda').then((module) => ({
    default: module.AgendaPage,
  })),
);
const EventHome = lazy(() =>
  import('../../../pages/EventHome').then((module) => ({
    default: module.EventHome,
  })),
);
const SpeakersPage = lazy(() =>
  import('../../../pages/Speakers').then((module) => ({
    default: module.SpeakersPage,
  })),
);
const SessionPending = lazy(() =>
  import('../../../pages/Session/SessionPending').then((module) => ({
    default: module.SessionPending,
  })),
);
const Networking = lazy(() =>
  import('../../../pages/Networking').then((module) => ({
    default: module.Networking,
  })),
);
const SponsorsPage = lazy(() =>
  import('../../../pages/Sponsors').then((module) => ({
    default: module.SponsorsPage,
  })),
);
const Profile = lazy(() => import('../../../pages/Profile'));
const Network = lazy(() => import('../../../pages/Network'));
const Settings = lazy(() => import('../../../pages/Settings'));
const Dashboard = lazy(() =>
  import('../../../pages/Dashboard').then((module) => ({
    default: module.Dashboard,
  })),
);
const OrganizationDashboard = lazy(
  () => import('../../../pages/Organizations/OrganizationDashboard'),
);

// Admin pages
const SessionManager = lazy(() =>
  import('../../../pages/EventAdmin/SessionManager').then((module) => ({
    default: module.SessionManager,
  })),
);
const SponsorsManager = lazy(() => import('../../../pages/EventAdmin/SponsorsManager'));
const NetworkingManager = lazy(() => import('../../../pages/EventAdmin/NetworkingManager'));
const AttendeesManager = lazy(() => import('../../../pages/EventAdmin/AttendeesManager'));
const SpeakersManager = lazy(() => import('../../../pages/EventAdmin/SpeakersManager'));
const EventSettings = lazy(() => import('../../../pages/EventAdmin/EventSettings'));

// Error page
const NotFound = lazy(() =>
  import('../../../pages/Errors/NotFound').then((module) => ({
    default: module.NotFound,
  })),
);

export const protectedRoutes: RouteObject[] = [
  {
    path: '/app',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <NewUserCheck />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'users/:userId',
        element: <Profile />,
      },
      {
        path: 'network',
        element: <Network />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'organizations',
        element: <Outlet />,
        children: [
          {
            index: true,
            element: <Navigate to='/app/dashboard' replace />,
          },
          {
            path: 'new',
            element: <CreateOrganization />,
          },
          {
            path: ':orgId',
            element: <Outlet />,
            children: [
              {
                path: '',
                element: <OrganizationDashboard />,
              },
              {
                path: 'events/:eventId',
                element: <Outlet />,
                children: [
                  {
                    path: '',
                    element: <AgendaPage />,
                  },
                  // New session-related routes
                  {
                    path: 'sessions/:sessionId',
                    element: <SessionPage />,
                  },
                  {
                    path: 'setup-session',
                    element: <SetupSession />,
                  },
                  {
                    path: 'session-pending',
                    element: <SessionPending />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: 'events',
        element: <Outlet />,
        children: [
          {
            path: '',
            element: <EventsList />,
          },
          {
            path: ':eventId',
            element: <Outlet />,
            children: [
              {
                path: '',
                element: <EventHome />,
              },
              {
                path: 'agenda',
                element: <AgendaPage />,
              },
              {
                path: 'speakers',
                element: <SpeakersPage />,
              },
              {
                path: 'networking',
                element: <Networking />,
              },
              {
                path: 'sponsors',
                element: <SponsorsPage />,
              },
              {
                path: 'sessions/:sessionId',
                element: <SessionPage />,
              },
              {
                path: 'session-pending',
                element: <SessionPending />,
              },
              {
                path: 'setup-session',
                element: <SetupSession />,
              },
              {
                path: 'admin',
                element: <Outlet />,
                children: [
                  {
                    path: '',
                    element: <Navigate to='settings' replace />,
                  },
                  {
                    path: 'sessions',
                    element: <SessionManager />,
                  },
                  {
                    path: 'attendees',
                    element: <AttendeesManager />,
                  },
                  {
                    path: 'speakers',
                    element: <SpeakersManager />,
                  },
                  {
                    path: 'sponsors',
                    element: <SponsorsManager />,
                  },
                  {
                    path: 'networking',
                    element: <NetworkingManager />,
                  },
                  {
                    path: 'settings',
                    element: <EventSettings />,
                  },
                ],
              },
              {
                path: '*',
                element: <NotFound />,
              },
            ],
          },
        ],
      },
    ],
  },
];
