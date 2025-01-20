import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/app/store/authSlice';

export const AuthGuard = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  // Add a check for tokens
  const hasTokens =
    localStorage.getItem('access_token') ||
    localStorage.getItem('refresh_token');

  // If we have tokens but aren't authenticated yet, assume we're loading
  if (hasTokens && !isAuthenticated) {
    return null; // Or loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};
