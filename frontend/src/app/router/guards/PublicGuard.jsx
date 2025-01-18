import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/app/store/authSlice';

export const PublicGuard = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const hasTokens =
    localStorage.getItem('access_token') ||
    localStorage.getItem('refresh_token');

  // Similar to AuthGuard, wait for auth check if we have tokens
  if (hasTokens && !isAuthenticated) {
    return null;
  }

  // If authenticated, redirect to app
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return children;
};
