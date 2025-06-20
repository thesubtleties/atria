// PublicGuard.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectAuthChecked,
} from '@/app/store/authSlice';

export const PublicGuard = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authChecked = useSelector(selectAuthChecked);

  // Show loading state while checking auth
  if (!authChecked) {
    return null;
  }

  // Redirect if authenticated
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return children;
};
