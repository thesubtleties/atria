// src/app/router/layouts/AppLayout/index.jsx
import { useEffect } from 'react';
import { AppShell, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetEventQuery } from '@/app/features/events/api';
import { TopNav, EventNav } from '@/pages/Navigation';
import {
  initializeSocket,
  disconnectSocket,
  fetchInitialData,
} from '@/app/features/networking/socketClient';
import { selectUser, selectIsAuthenticated } from '@/app/store/authSlice';
import ChatContainer from '@/shared/components/chat';
import styles from './AppLayout.module.css';

export const AppLayout = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  // Use selectors for auth state
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Debug auth state
  console.log('🔐 AppLayout - Auth state:', { isAuthenticated, user });

  // Only fetch event data if eventId exists
  const { data: event, error: eventError, isError: eventIsError } = useGetEventQuery(eventId, {
    skip: !eventId, // Skip the query if eventId is undefined
  });
  
  // Redirect to dashboard if event is deleted (404) or user has no access (403)
  useEffect(() => {
    if (eventId && eventIsError && (eventError?.status === 404 || eventError?.status === 403)) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [eventId, eventIsError, eventError, navigate]);
  
  // Check if current user has ADMIN or ORGANIZER role in this event
  const isAdmin = event?.user_role === 'ADMIN' || event?.user_role === 'ORGANIZER';

  const showEventNav = Boolean(eventId);

  // Initialize socket when authenticated
  useEffect(() => {
    console.log('🔐 AppLayout useEffect - Auth check:', { isAuthenticated, hasUser: !!user });
    if (isAuthenticated && user) {
      const initSocket = async () => {
        try {
          // Fetch socket token from API
          const apiUrl = import.meta.env.VITE_API_URL || '/api';
          const response = await fetch(`${apiUrl}/auth/socket-token`, {
            credentials: 'include',
          });
          
          console.log('Socket token response:', response.status, response.statusText);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Socket token data:', data);
            const { token } = data;
            console.log('Initializing socket in AppLayout with token:', token ? 'YES' : 'NO');
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
      console.log('🔌 AppLayout cleanup - disconnecting socket');
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  return (
    <AppShell
      className={styles.layout}
      header={{ height: 60 }}
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
                  color="#FFD666"
                  transitionDuration={200}
                />
                <Burger
                  opened={desktopOpened}
                  onClick={toggleDesktop}
                  visibleFrom="sm"
                  size="sm"
                  color="#FFD666"
                  transitionDuration={200}
                />
              </>
            )
          }
        />
      </AppShell.Header>

      {showEventNav && (
        <AppShell.Navbar>
          <EventNav eventId={eventId} isAdmin={isAdmin} onMobileNavClick={toggleMobile} />
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
