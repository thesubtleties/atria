import { NavLink, Divider, Text } from '@mantine/core';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import styles from './AdminSection.module.css';

export const AdminSection = ({ eventId }) => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className={styles.container}>
      <Divider my="sm" />
      <Text size="sm" fw={500} mb="xs">
        Admin
      </Text>
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/sessions`}
        label="Sessions"
        active={isActive(`/app/events/${eventId}/admin/sessions`)}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/attendees`}
        label="Attendees"
        active={isActive(`/app/events/${eventId}/admin/attendees`)}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/speakers`}
        label="Speakers"
        active={isActive(`/app/events/${eventId}/admin/speakers`)}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/sponsors`}
        label="Sponsors"
        active={isActive(`/app/events/${eventId}/admin/sponsors`)}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/networking`}
        label="Networking"
        active={isActive(`/app/events/${eventId}/admin/networking`)}
      />
      <NavLink
        component={RouterNavLink}
        to={`/app/events/${eventId}/admin/settings`}
        label="Event Settings"
        active={isActive(`/app/events/${eventId}/admin/settings`)}
      />
    </div>
  );
};
