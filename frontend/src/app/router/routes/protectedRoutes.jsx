// src/app/router/routes/protectedRoutes.js
import { Outlet } from 'react-router-dom';
import { AuthGuard } from '../guards/AuthGuard';
import { AppLayout } from '../layouts/AppLayout';
import { NewUserCheck } from '../../../pages/NewUserLanding';
import { CreateOrganization } from '../../../pages/Organizations/CreateOrganization';
import { OrganizationsList } from '../../../pages/Organizations/OrganizationsList';

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
  OrganizationDashboard: false,
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
        path: 'organizations',
        element: <Outlet />,
        children: [
          {
            path: '',
            element: <OrganizationsList />,
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
                element: getComponent('OrganizationDashboard'),
              },
              {
                path: 'events',
                element: getComponent('EventsListView', 'organization'),
              },
              {
                path: 'events/:eventId',
                element: <Outlet />,
                children: [
                  {
                    path: '',
                    element: getComponent('EventAgenda'),
                  },
                  {
                    path: 'admin',
                    element: getComponent('EventDashboard'),
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
            element: getComponent('EventsListView', 'user'),
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
