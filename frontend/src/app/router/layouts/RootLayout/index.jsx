import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authApi } from '@/app/features/auth/api';

export const RootLayout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      dispatch(authApi.endpoints.getCurrentUser.initiate());
    }
  }, [dispatch]);

  return (
    <>
      <Outlet />
    </>
  );
};
