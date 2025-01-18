import { Landing } from '../../../pages/Landing';
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
];
