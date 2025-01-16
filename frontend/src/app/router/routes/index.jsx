import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './publicRoutes';
import { protectedRoutes } from './protectedRoutes';

export const router = createBrowserRouter([
  ...publicRoutes,
  ...protectedRoutes,
]);
