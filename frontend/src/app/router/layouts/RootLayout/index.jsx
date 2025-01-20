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
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          await dispatch(authApi.endpoints.getCurrentUser.initiate()).unwrap();
        } catch (error) {
          // If getCurrentUser fails, clear auth state
          console.error('Auth initialization failed:', error);
          localStorage.clear();
          dispatch(setUser(null));
          navigate('/');
        }
      }
    };

    initializeAuth();
  }, [dispatch, navigate]);

  return <Outlet />;
};
