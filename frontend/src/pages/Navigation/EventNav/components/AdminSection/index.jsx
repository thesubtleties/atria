import { NavLink, Divider, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import styles from './AdminSection.module.css';

export const AdminSection = ({ eventId }) => {
  return (
    <div className={styles.container}>
      <Divider my="sm" />
      <Text size="sm" fw={500} mb="xs">
        Admin
      </Text>
      <NavLink
        component={Link}
        to={`/app/events/${eventId}/admin/sessions`}
        label="Sessions"
      />
      <NavLink
        component={Link}
        to={`/app/events/${eventId}/admin/attendees`}
        label="Attendees"
      />
      <NavLink
        component={Link}
        to={`/app/events/${eventId}/admin/speakers`}
        label="Speakers"
      />
      <NavLink
        component={Link}
        to={`/app/events/${eventId}/admin/sponsors`}
        label="Sponsors"
      />
      <NavLink
        component={Link}
        to={`/app/events/${eventId}/admin/networking`}
        label="Networking"
      />
      <NavLink
        component={Link}
        to={`/app/events/${eventId}/admin/settings`}
        label="Event Settings"
      />
    </div>
  );
};
