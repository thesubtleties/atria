// app/router/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './publicRoutes';
import { protectedRoutes } from './protectedRoutes';
import { RootLayout } from '../layouts/RootLayout';
import { ErrorPage } from '../../../pages/Errors/ErrorPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [...publicRoutes, ...protectedRoutes],
  },
]);
