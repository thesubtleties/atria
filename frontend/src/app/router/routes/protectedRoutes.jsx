// src/app/router/routes/protectedRoutes.js
import { Outlet, Navigate } from 'react-router-dom';
import { AuthGuard } from '../guards/AuthGuard';
import { AppLayout } from '../layouts/AppLayout';
import { NewUserCheck } from '../../../pages/NewUserLanding';
import { CreateOrganization } from '../../../pages/Organizations/CreateOrganization';
import { EventsList } from '../../../pages/Events/EventsList';
import { SetupSession } from '../../../pages/Session/SetupSession';
import { SessionPage } from '../../../pages/Session';
import { AgendaPage } from '../../../pages/Agenda';
import { EventHome } from '../../../pages/EventHome';
import { SpeakersPage } from '../../../pages/Speakers';
import { SessionPending } from '../../../pages/Session/SessionPending';
import RoadmapPage from '@/pages/Roadmap';
import { Networking } from '../../../pages/Networking';
import { SponsorsPage } from '../../../pages/Sponsors';
import Profile from '../../../pages/Profile';
import Network from '../../../pages/Network';
import Settings from '../../../pages/Settings';
import { Dashboard } from '../../../pages/Dashboard';
import OrganizationDashboard from '../../../pages/Organizations/OrganizationDashboard';
import { SessionManager } from '../../../pages/EventAdmin/SessionManager';
import SponsorsManager from '../../../pages/EventAdmin/SponsorsManager';
import NetworkingManager from '../../../pages/EventAdmin/NetworkingManager';
import AttendeesManager from '../../../pages/EventAdmin/AttendeesManager';
import SpeakersManager from '../../../pages/EventAdmin/SpeakersManager';
import EventSettings from '../../../pages/EventAdmin/EventSettings';

// Placeholder component for development
const PlaceholderComponent = ({ routeName = 'This page' }) => (
  <div
    style={{
      padding: '20px',
      textAlign: 'center',
      margin: '20px',
      border: '2px dashed #ccc',
      borderRadius: '8px',
    }}
  >
    <h2>{routeName} is under construction</h2>
    <p>🚧 Coming Soon 🚧</p>
    <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '10px' }}>
      Current Route: {routeName}
    </pre>
  </div>
);

const COMPONENTS_READY = {
  OrganizationsPage: false,
  OrganizationDashboard: true,
  EventsListView: false,
  EventAgenda: false,
  EventDashboard: false,
  JoinEventPage: false,
};

const getComponent = (componentName, context = '') => {
  if (COMPONENTS_READY[componentName]) {
    return <PlaceholderComponent routeName={`${componentName} (Ready)`} />;
  }
  return (
    <PlaceholderComponent
      routeName={`${componentName}${context ? ` (${context})` : ''}`}
    />
  );
};

export const protectedRoutes = [
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
            element: <Navigate to="/app/dashboard" replace />,
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
                  {
                    path: 'admin',
                    element: <Outlet />,
                    children: [
                      {
                        path: '',
                        element: getComponent('EventDashboard'),
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
                        element: <PlaceholderComponent routeName="Speakers Management" />,
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
                    element: getComponent('EventDashboard'),
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
                element: <RoadmapPage />,
              },
            ],
          },
          {
            path: 'join',
            element: getComponent('JoinEventPage'),
          },
        ],
      },
    ],
  },
];
