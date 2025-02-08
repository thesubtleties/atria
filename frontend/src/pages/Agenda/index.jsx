// pages/Agenda/index.jsx
import { DateNavigation } from './DateNavigation';
import { AgendaView } from './AgendaView';
import { useState } from 'react';
import styles from './styles/index.module.css';
import PropTypes from 'prop-types';

export const AgendaPage = ({ event, sessions = [] }) => {
  const [currentDay, setCurrentDay] = useState(1);

  if (!event?.start_date || !event?.day_count) {
    return <div>Event information not available</div>;
  }

  const filteredSessions = sessions?.filter((session) => {
    if (!session.start_time) return false;

    const sessionDate = new Date(session.start_time);
    const dayStart = new Date(event.start_date);
    dayStart.setDate(dayStart.getDate() + (currentDay - 1));

    return sessionDate.toDateString() === dayStart.toDateString();
  });

  return (
    <div className={styles.container}>
      <DateNavigation
        startDate={event.start_date}
        dayCount={event.day_count}
        currentDay={currentDay}
        onDateChange={setCurrentDay}
      />
      <AgendaView sessions={filteredSessions || []} />
    </div>
  );
};

AgendaPage.propTypes = {
  event: PropTypes.shape({
    start_date: PropTypes.string.isRequired,
    day_count: PropTypes.number.isRequired,
    title: PropTypes.string,
  }).isRequired,
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      start_time: PropTypes.string,
      end_time: PropTypes.string,
    })
  ),
};

export default AgendaPage;
