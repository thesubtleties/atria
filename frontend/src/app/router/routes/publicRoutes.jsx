import { Landing } from '../../../pages/Landing';
import { EmailVerification } from '../../../pages/Auth/EmailVerification';
import { ResetPassword } from '../../../pages/Auth/ResetPassword';
import AcceptInvitation from '../../../pages/Invitations/AcceptInvitation';
import { PublicGuard } from '../guards/PublicGuard';
import { NotFound } from '../../../pages/Errors/NotFound';

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
