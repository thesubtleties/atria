import { Outlet } from 'react-router-dom';
import { Navigation } from '../../../../pages/Navigation';

export const AppLayout = () => (
  <>
    <Navigation />
    <Outlet />
  </>
);
