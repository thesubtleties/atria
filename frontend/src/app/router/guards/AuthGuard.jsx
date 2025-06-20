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

  // Show loading state while checking auth
  if (!authChecked) {
    return null;
  }

  // Redirect if not authenticated after check
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};
