import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { authApi } from '@/app/features/auth/api';
import { setUser } from '../../../store/authSlice';
import type { AppDispatch } from '@/app/store';

export const RootLayout = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const initializeAuth = async () => {
      // Always try to get current user - cookies will be sent automatically
      try {
        await dispatch(authApi.endpoints.getCurrentUser.initiate()).unwrap();
      } catch {
        // If getCurrentUser fails with 401, user is not authenticated
        // Don't redirect - let the user stay on public pages
        console.log('User not authenticated or session expired');
        dispatch(setUser(null));
      }
    };

    initializeAuth();
  }, [dispatch]);

  return <Outlet />;
};
