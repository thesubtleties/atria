import { NavLink } from '@mantine/core';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import type { Event, EventDetail } from '@/types/events';
import styles from './EventLinks.module.css';

type EventLinksProps = {
  eventId: string | number;
  event: Event | EventDetail | null;
  onMobileNavClick?: () => void;
};

export const EventLinks = ({ eventId, event, onMobileNavClick }: EventLinksProps) => {
  const location = useLocation();

  const isActive = (path: string): boolean => {
    if (path === `/app/events/${eventId}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    if (onMobileNavClick && window.innerWidth <= 480) {
      onMobileNavClick();
    }
  };

  const mainSessionInfo = useMemo(() => {
    if (event?.event_type !== 'single_session') {
      return null;
    }

    if (event.main_session_id) {
      return {
        id: event.main_session_id,
        label: 'Main Stage',
      };
    }

    if ('sessions' in event && event.sessions && event.sessions.length > 0) {
      const sortedSessions = [...event.sessions].sort((a, b) => {
        if (a.day_number !== b.day_number) {
          return a.day_number - b.day_number;
        }
        return a.start_time.localeCompare(b.start_time);
      });

      const firstSession = sortedSessions[0];
      if (firstSession) {
        return {
          id: firstSession.id,
          label: 'Main Stage',
        };
      }
    }

    return null;
  }, [event]);

  const hasActiveSponsors = ('sponsors_count' in (event ?? {}) ? (event as EventDetail).sponsors_count : 0) > 0;

  return (
    <div className={styles.container ?? ''}>
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}`}
        label='Event Home'
        active={isActive(`/app/events/${eventId}`)}
        onClick={handleNavClick}
      />
      {event?.event_type === 'single_session' && mainSessionInfo ? (
        <NavLink
          component={RouterNavLink}
          to={`/app/events/${eventId}/sessions/${mainSessionInfo.id}`}
          label={mainSessionInfo.label}
          active={isActive(`/app/events/${eventId}/sessions/${mainSessionInfo.id}`)}
          onClick={handleNavClick}
        />
      ) : (
        <NavLink
          component={RouterNavLink}
          to={`/app/events/${eventId}/agenda`}
          label='Agenda'
          active={isActive(`/app/events/${eventId}/agenda`)}
          onClick={handleNavClick}
        />
      )}
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/speakers`}
        label='Speakers'
        active={isActive(`/app/events/${eventId}/speakers`)}
        onClick={handleNavClick}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/networking`}
        label='Networking'
        active={isActive(`/app/events/${eventId}/networking`)}
        onClick={handleNavClick}
      />
      {hasActiveSponsors && (
        <NavLink
          component={RouterNavLink}
          to={`/app/events/${eventId}/sponsors`}
          label='Sponsors'
          active={isActive(`/app/events/${eventId}/sponsors`)}
          onClick={handleNavClick}
        />
      )}
    </div>
  );
};

