import { NavLink } from '@mantine/core';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import styles from './EventLinks.module.css';

export const EventLinks = ({ eventId }) => {
  const location = useLocation();
  
  const isActive = (path) => {
    // For Event Home, only match exact path
    if (path === `/app/events/${eventId}`) {
      return location.pathname === path;
    }
    // For other paths, match if the pathname starts with the path
    return location.pathname.startsWith(path);
  };

  return (
    <div className={styles.container}>
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}`}
        label="Event Home"
        active={isActive(`/app/events/${eventId}`)}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/agenda`}
        label="Agenda"
        active={isActive(`/app/events/${eventId}/agenda`)}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/speakers`}
        label="Speakers"
        active={isActive(`/app/events/${eventId}/speakers`)}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/networking`}
        label="Networking"
        active={isActive(`/app/events/${eventId}/networking`)}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/sponsors`}
        label="Sponsors"
        active={isActive(`/app/events/${eventId}/sponsors`)}
      />
    </div>
  );
};
