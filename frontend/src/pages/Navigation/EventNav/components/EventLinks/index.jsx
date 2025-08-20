import { NavLink } from '@mantine/core';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import styles from './EventLinks.module.css';

export const EventLinks = ({ eventId, onMobileNavClick }) => {
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

  return (
    <div className={styles.container}>
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}`}
        label="Event Home"
        active={isActive(`/app/events/${eventId}`)}
        onClick={handleNavClick}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/agenda`}
        label="Agenda"
        active={isActive(`/app/events/${eventId}/agenda`)}
        onClick={handleNavClick}
      />
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
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/sponsors`}
        label="Sponsors"
        active={isActive(`/app/events/${eventId}/sponsors`)}
        onClick={handleNavClick}
      />
    </div>
  );
};
