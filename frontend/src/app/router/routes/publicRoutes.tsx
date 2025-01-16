import { Outlet } from 'react-router-dom';
import { AuthGuard } from '../guards/AuthGuard';
import { AppLayout } from '../layouts/AppLayout';
import {
  OrganizationsPage,
  OrganizationDashboard,
} from '@/features/organizations/pages';
import {
  EventsListView,
  EventAgenda,
  EventDashboard,
  JoinEventPage,
} from '@/features/events/pages';
import type { RouteConfig } from './types';

export const protectedRoutes: RouteConfig[] = [
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
        element: <Outlet />,
        children: [
          {
            path: '',
            element: <OrganizationsPage />,
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
                path: 'events',
                element: <EventsListView context="organization" />,
              },
              {
                path: 'events/:eventId',
                element: <Outlet />, // Added element
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
        element: <Outlet />, // Added element
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
