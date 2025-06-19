// src/app/router/layouts/AppLayout/index.jsx
import { useEffect } from 'react';
import { AppShell, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetEventQuery } from '@/app/features/events/api';
import { TopNav, EventNav } from '@/pages/Navigation';
import {
  initializeSocket,
  disconnectSocket,
  fetchInitialData,
} from '@/app/features/networking/socketClient';
import { selectUser, selectIsAuthenticated } from '@/app/store/authSlice';
import ChatContainer from '@/shared/components/chat/ChatContainer';
import styles from './AppLayout.module.css';

export const AppLayout = () => {
  const { eventId } = useParams();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  // Use selectors for auth state
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Only fetch event data if eventId exists
  const { data: event } = useGetEventQuery(eventId, {
    skip: !eventId, // Skip the query if eventId is undefined
  });
  const isAdmin = event?.organizers?.some((org) => org.role === 'ADMIN');

  const showEventNav = Boolean(eventId);

  // Initialize socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const initSocket = async () => {
        try {
          // Fetch socket token from API
          const apiUrl = import.meta.env.VITE_API_URL || '/api';
          const response = await fetch(`${apiUrl}/auth/socket-token`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const { token } = await response.json();
            console.log('Initializing socket in AppLayout');
            const socket = initializeSocket(token);

            // If socket is already connected, fetch data immediately
            if (socket.connected) {
              console.log('Socket already connected, fetching initial data');
              fetchInitialData().catch((err) =>
                console.error('Error fetching initial data:', err)
              );
            }
            // Otherwise socket.on('connect') in socketClient will handle it
          } else {
            console.error('Failed to get socket token:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error initializing socket:', error);
        }
      };

      initSocket();
    }

    // Cleanup socket on unmount
    return () => {
      console.log('Cleaning up socket connection');
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  return (
    <AppShell
      className={styles.layout}
      header={{ height: 82 }}
      navbar={
        showEventNav
          ? {
              width: 300,
              breakpoint: 'sm',
              collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
            }
          : undefined
      }
      padding="md"
    >
      <AppShell.Header>
        <TopNav
          leftContent={
            showEventNav && (
              <>
                <Burger
                  opened={mobileOpened}
                  onClick={toggleMobile}
                  hiddenFrom="sm"
                  size="sm"
                />
                <Burger
                  opened={desktopOpened}
                  onClick={toggleDesktop}
                  visibleFrom="sm"
                  size="sm"
                />
              </>
            )
          }
        />
      </AppShell.Header>

      {showEventNav && (
        <AppShell.Navbar p="md">
          <EventNav eventId={eventId} isAdmin={isAdmin} />
        </AppShell.Navbar>
      )}

      <AppShell.Main className={styles.main}>
        <Outlet />
        {/* Use user instead of currentUser */}
        {user && <ChatContainer />}
      </AppShell.Main>
    </AppShell>
  );
};
