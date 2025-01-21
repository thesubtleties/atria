// AuthGuard.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectAuthChecked,
} from '@/app/store/authSlice';

export const AuthGuard = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authChecked = useSelector(selectAuthChecked);
  const location = useLocation();
  const hasTokens =
    localStorage.getItem('access_token') &&
    localStorage.getItem('refresh_token');

  // Only show loading state if we have tokens AND auth hasn't been checked
  if (hasTokens && !authChecked) {
    return null;
  }

  // Only redirect if we're sure we're not authenticated
  if (!isAuthenticated && authChecked) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};
