import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './publicRoutes';
import { protectedRoutes } from './protectedRoutes';
import { RootLayout } from '../layouts/RootLayout';
import { ErrorPage } from '../../../pages/Errors/ErrorPage';
import { LoadingPage } from '../../../shared/components/loading/LoadingState';

// Wrap routes with Suspense boundary for lazy-loaded components
const withSuspense = (routes: RouteObject[]): RouteObject[] =>
  routes.map((route): RouteObject => {
    const result: RouteObject = { ...route };

    if (route.element) {
      result.element = <Suspense fallback={<LoadingPage />}>{route.element}</Suspense>;
    }

    if (route.children) {
      result.children = withSuspense(route.children);
    }

    return result;
  });

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [...withSuspense(publicRoutes), ...withSuspense(protectedRoutes)],
  },
]);
