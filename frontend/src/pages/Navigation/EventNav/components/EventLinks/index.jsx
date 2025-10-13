import { NavLink } from '@mantine/core';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import styles from './EventLinks.module.css';

export const EventLinks = ({ eventId, event, onMobileNavClick }) => {
  const location = useLocation();
  
  const isActive = (path) => {
    // For Event Home, only match exact path
    if (path === `/app/events/${eventId}`) {
      return location.pathname === path;
    }
    // For other paths, match if the pathname starts with the path
    return location.pathname.startsWith(path);
  };

  // Handle mobile nav click - close nav on mobile only
  const handleNavClick = () => {
    if (onMobileNavClick && window.innerWidth <= 480) {
      onMobileNavClick();
    }
  };
  
  // Determine the main session for single_session events
  const mainSessionInfo = useMemo(() => {
    if (event?.event_type !== 'SINGLE_SESSION') {
      return null;
    }

    // Use main_session_id if available
    if (event.main_session_id) {
      return {
        id: event.main_session_id,
        label: 'Main Stage'
      };
    }

    // Fallback: find first session chronologically
    if (event.sessions && event.sessions.length > 0) {
      const sortedSessions = [...event.sessions].sort((a, b) => {
        // Sort by day_number first, then by start_time
        if (a.day_number !== b.day_number) {
          return a.day_number - b.day_number;
        }
        return a.start_time.localeCompare(b.start_time);
      });

      return {
        id: sortedSessions[0].id,
        label: 'Main Stage'
      };
    }

    return null;
  }, [event]);

  // Check if there are active sponsors to show (using computed field from backend)
  const hasActiveSponsors = (event?.sponsors_count ?? 0) > 0;

  return (
    <div className={styles.container}>
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}`}
        label="Event Home"
        active={isActive(`/app/events/${eventId}`)}
        onClick={handleNavClick}
      />
      {event?.event_type === 'SINGLE_SESSION' && mainSessionInfo ? (
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
          label="Agenda"
          active={isActive(`/app/events/${eventId}/agenda`)}
          onClick={handleNavClick}
        />
      )}
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/speakers`}
        label="Speakers"
        active={isActive(`/app/events/${eventId}/speakers`)}
        onClick={handleNavClick}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/networking`}
        label="Networking"
        active={isActive(`/app/events/${eventId}/networking`)}
        onClick={handleNavClick}
      />
      {hasActiveSponsors && (
        <NavLink
          component={RouterNavLink}
          to={`/app/events/${eventId}/sponsors`}
          label="Sponsors"
          active={isActive(`/app/events/${eventId}/sponsors`)}
          onClick={handleNavClick}
        />
      )}
    </div>
  );
};
