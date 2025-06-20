// app/router/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './publicRoutes';
import { protectedRoutes } from './protectedRoutes';
import { RootLayout } from '../layouts/RootLayout';
import { store } from '@/app/store';
import { authApi } from '@/app/features/auth/api';

async function authLoader() {
  // Always try to get current user - cookies will be sent automatically
  try {
    await store.dispatch(authApi.endpoints.getCurrentUser.initiate());
  } catch (error) {
    // User not authenticated, that's OK
    console.log('User not authenticated');
  }
  return null;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    loader: authLoader,
    children: [...publicRoutes, ...protectedRoutes],
  },
]);
