import { NavLink, Divider, Text } from '@mantine/core';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import styles from './AdminSection.module.css';

export const AdminSection = ({ eventId, onMobileNavClick }) => {
  const location = useLocation();

  const isActive = (path) => {
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
      <Divider my='sm' />
      <Text size='sm' fw={500} mb='xs'>
        Admin
      </Text>
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/sessions`}
        label='Sessions'
        active={isActive(`/app/events/${eventId}/admin/sessions`)}
        onClick={handleNavClick}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/attendees`}
        label='Attendees'
        active={isActive(`/app/events/${eventId}/admin/attendees`)}
        onClick={handleNavClick}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/speakers`}
        label='Speakers'
        active={isActive(`/app/events/${eventId}/admin/speakers`)}
        onClick={handleNavClick}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/sponsors`}
        label='Sponsors'
        active={isActive(`/app/events/${eventId}/admin/sponsors`)}
        onClick={handleNavClick}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/networking`}
        label='Networking'
        active={isActive(`/app/events/${eventId}/admin/networking`)}
        onClick={handleNavClick}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/settings`}
        label='Event Settings'
        active={isActive(`/app/events/${eventId}/admin/settings`)}
        onClick={handleNavClick}
      />
    </div>
  );
};
