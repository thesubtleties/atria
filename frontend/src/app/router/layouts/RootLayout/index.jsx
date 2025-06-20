// RootLayout.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { authApi } from '@/app/features/auth/api';
import { setUser } from '../../../store/authSlice';

export const RootLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      // Always try to get current user - cookies will be sent automatically
      try {
        await dispatch(authApi.endpoints.getCurrentUser.initiate()).unwrap();
      } catch (error) {
        // If getCurrentUser fails with 401, user is not authenticated
        // Don't redirect - let the user stay on public pages
        console.log('User not authenticated or session expired');
        dispatch(setUser(null));
      }
    };

    initializeAuth();
  }, [dispatch, navigate]);

  return <Outlet />;
};
