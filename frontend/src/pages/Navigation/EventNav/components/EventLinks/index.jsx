import { NavLink } from '@mantine/core';
import { Link } from 'react-router-dom';
import styles from './EventLinks.module.css';

export const EventLinks = ({ eventId }) => {
  return (
    <div className={styles.container}>
      <NavLink
        component={Link}
        to={`/app/events/${eventId}`}
        label="Event Home"
      />
      <NavLink
        component={Link}
        to={`/app/events/${eventId}/agenda`}
        label="Agenda"
      />
      <NavLink
        component={Link}
        to={`/app/events/${eventId}/speakers`}
        label="Speakers"
      />
      <NavLink
        component={Link}
        to={`/app/events/${eventId}/networking`}
        label="Networking"
      />
      <NavLink
        component={Link}
        to={`/app/events/${eventId}/sponsors`}
        label="Sponsors"
      />
    </div>
  );
};
