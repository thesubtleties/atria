import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectAuthChecked } from '@/app/store/authSlice';

type PublicGuardProps = {
  children: ReactNode;
};

export const PublicGuard = ({ children }: PublicGuardProps) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authChecked = useSelector(selectAuthChecked);

  // Always render children immediately for public pages (prevents hydration flash)
  // Auth check happens in background, redirect occurs once check completes
  // This is safe because public pages are meant to be accessible without auth

  // Redirect if authenticated (only after auth check completes)
  if (authChecked && isAuthenticated) {
    return <Navigate to='/app' replace />;
  }

  return <>{children}</>;
};
