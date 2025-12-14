import { lazy } from 'react';
import { Landing } from '../../../pages/Landing';
import { PublicGuard } from '../guards/PublicGuard';

// Lazy load non-critical public routes
const EmailVerification = lazy(() =>
  import('../../../pages/Auth/EmailVerification').then((module) => ({
    default: module.EmailVerification,
  })),
);
const ResetPassword = lazy(() =>
  import('../../../pages/Auth/ResetPassword').then((module) => ({
    default: module.ResetPassword,
  })),
);
const AcceptInvitation = lazy(() => import('../../../pages/Invitations/AcceptInvitation'));
const NotFound = lazy(() =>
  import('../../../pages/Errors/NotFound').then((module) => ({
    default: module.NotFound,
  })),
);

export const publicRoutes = [
  {
    path: '/',
    element: (
      <PublicGuard>
        <Landing />
      </PublicGuard>
    ),
  },
  {
    path: '/verify-email/:token',
    element: <EmailVerification />,
  },
  {
    path: '/reset-password/:token',
    element: <ResetPassword />,
  },
  {
    path: '/invitations/:token',
    element: <AcceptInvitation />,
  },
  {
    // Catch-all route for 404 - must be last
    path: '*',
    element: <NotFound />,
  },
];
