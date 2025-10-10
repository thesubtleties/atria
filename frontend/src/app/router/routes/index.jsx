// app/router/routes/index.jsx
import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './publicRoutes';
import { protectedRoutes } from './protectedRoutes';
import { RootLayout } from '../layouts/RootLayout';
import { ErrorPage } from '../../../pages/Errors/ErrorPage';
import { LoadingPage } from '../../../shared/components/loading/LoadingState';

// Wrap routes with Suspense boundary for lazy-loaded components
const withSuspense = (routes) =>
  routes.map((route) => ({
    ...route,
    element: route.element ? (
      <Suspense fallback={<LoadingPage />}>{route.element}</Suspense>
    ) : undefined,
    children: route.children ? withSuspense(route.children) : undefined,
  }));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      ...withSuspense(publicRoutes),
      ...withSuspense(protectedRoutes),
    ],
  },
]);
