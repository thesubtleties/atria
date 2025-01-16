// src/app/router/routes/publicRoutes.jsx
import { LandingLayout } from '@/features/landing/layouts';
import { LandingPage } from '@/features/landing/pages';

export const publicRoutes = [
  {
    path: '/',
    element: <LandingLayout />,
    children: [
      {
        path: '',
        element: <LandingPage />,
      },
    ],
  },
];
