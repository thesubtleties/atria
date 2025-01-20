// app/router/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './publicRoutes';
import { protectedRoutes } from './protectedRoutes';
import { RootLayout } from '../layouts/RootLayout';
import { store } from '@/app/store';
import { authApi } from '@/app/features/auth/api';

async function authLoader() {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  if (accessToken) {
    await store.dispatch(authApi.endpoints.getCurrentUser.initiate());
  } else if (refreshToken) {
    try {
      // Use our existing refresh mutation which handles:
      // - Getting new access token
      // - Getting user data
      // - Setting user in state
      await store.dispatch(authApi.endpoints.refresh.initiate());
    } catch (error) {
      console.error('Auth restoration failed:', error);
      // Our refresh mutation already handles cleanup on failure
    }
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
