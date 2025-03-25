import { AppShell, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useParams } from 'react-router-dom';
import { useGetEventQuery } from '@/app/features/events/api';
import { TopNav, EventNav } from '@/pages/Navigation';
import { useSelector } from 'react-redux';
import styles from './AppLayout.module.css';

export const AppLayout = () => {
  const { eventId } = useParams();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const { data: event } = useGetEventQuery(eventId);
  const isAdmin = event?.organizers?.some((org) => org.role === 'ADMIN');

  const showEventNav = Boolean(eventId);

  // for logging of state globally
  // const result = useSelector((state) => state);
  // console.log('Full state:', result);

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
      </AppShell.Main>
    </AppShell>
  );
};
