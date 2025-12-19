import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Alert, Container } from '@mantine/core';
import { selectIsAuthenticated, selectAuthChecked, selectUser } from '@/app/store/authSlice';

type AuthGuardProps = {
  children: ReactNode;
  requireEmailVerification?: boolean;
};

export const AuthGuard = ({ children, requireEmailVerification = true }: AuthGuardProps) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authChecked = useSelector(selectAuthChecked);
  const user = useSelector(selectUser);
  const location = useLocation();

  // Show loading state while checking auth
  if (!authChecked) {
    return null;
  }

  // Redirect if not authenticated after check
  if (!isAuthenticated) {
    return <Navigate to='/' state={{ from: location }} replace />;
  }

  // Check email verification if required
  if (requireEmailVerification && user && user.email_verified === false) {
    return (
      <Container size='sm' mt='xl'>
        <Alert color='yellow' title='Email Verification Required'>
          Please verify your email address to access this page. Check your email for the
          verification link.
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};
