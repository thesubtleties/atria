// app/router/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './publicRoutes';
import { protectedRoutes } from './protectedRoutes';
import { RootLayout } from '../layouts/RootLayout';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [...publicRoutes, ...protectedRoutes],
  },
]);
