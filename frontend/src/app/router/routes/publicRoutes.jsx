import { Landing } from '../../../pages/Landing';
import { EmailVerification } from '../../../pages/Auth/EmailVerification';
import { ResetPassword } from '../../../pages/Auth/ResetPassword';
import { PublicGuard } from '../guards/PublicGuard';

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
];
