// src/app/router/routes/protectedRoutes.js
import { Outlet } from 'react-router-dom';
import { AuthGuard } from '../guards/AuthGuard';
import { AppLayout } from '../layouts/AppLayout';
import { OrganizationsPage } from '@/features/organizations/pages';
import { OrganizationDashboard } from '@/features/organizations/pages';
import { EventsListView } from '@/features/events/pages';
import { EventAgenda } from '@/features/events/pages';
import { EventDashboard } from '@/features/events/pages';
import { JoinEventPage } from '@/features/events/pages';

// Remove type annotation and just export the array
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
        path: 'organizations',
        element: <Outlet />, // Shows either: OrganizationsPage or org content
        children: [
          {
            path: '',
            element: <OrganizationsPage />,
          },
          {
            path: ':orgId',
            element: <Outlet />, // Shows: Dashboard, events list, or event content
            children: [
              {
                path: '',
                element: <OrganizationDashboard />,
              },
              {
                path: 'events',
                element: <EventsListView context="organization" />,
              },
              {
                path: 'events/:eventId',
                element: <Outlet />, // Shows: Agenda or Dashboard
                children: [
                  {
                    path: '',
                    element: <EventAgenda />,
                  },
                  {
                    path: 'admin',
                    element: <EventDashboard />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: 'events',
        element: <Outlet />, // Shows: User's events or join page
        children: [
          {
            path: '',
            element: <EventsListView context="user" />,
          },
          {
            path: 'join',
            element: <JoinEventPage />,
          },
        ],
      },
    ],
  },
];
