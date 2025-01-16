// src/app/router/routes/protectedRoutes.tsx
import { Outlet } from 'react-router-dom'; // Don't forget this import!
import { AuthGuard } from '../guards/AuthGuard';
import { AppLayout } from '../layouts/AppLayout';
import { OrganizationsPage } from '@/features/organizations/pages';
import { OrganizationDashboard } from '@/features/organizations/pages';
import { EventsListView } from '@/features/events/pages';
import { EventAgenda } from '@/features/events/pages';
import { EventDashboard } from '@/features/events/pages';
import { JoinEventPage } from '@/features/events/pages';
import type { RouteConfig } from './types';

// src/app/router/routes/protectedRoutes.tsx
export const protectedRoutes: RouteConfig[] = [
  {
    path: '/app',
    element: (
      <AuthGuard>
        <AppLayout /> // This AppLayout has its own Outlet where all app content
        renders
      </AuthGuard>
    ),
    children: [
      {
        path: 'organizations',
        element: <Outlet />, // Shows either: OrganizationsPage (list of orgs)
        // OR specific org content (:orgId routes)
        children: [
          {
            path: '',
            element: <OrganizationsPage />,
          },
          {
            path: ':orgId',
            element: <Outlet />, // Shows either: OrganizationDashboard
            // OR events list
            // OR specific event content
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
                element: <Outlet />, // Shows either: EventAgenda OR EventDashboard (admin view)
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
        element: <Outlet />, // Shows either: User's events list
        // OR join event page
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
