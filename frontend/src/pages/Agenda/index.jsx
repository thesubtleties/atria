// pages/Agenda/index.jsx
import { useParams, useLocation } from 'react-router-dom';
import { useGetEventQuery } from '../../app/features/events/api';
import { useGetSessionsQuery } from '../../app/features/sessions/api';
import { DateNavigation } from './DateNavigation';
import { AgendaView } from './AgendaView';
import { useState } from 'react';
import styles from './styles/index.module.css';

export const AgendaPage = () => {
  const { eventId, orgId } = useParams();
  const location = useLocation();
  const isOrgView = location.pathname.includes('/organizations/');
  const [currentDay, setCurrentDay] = useState(1);

  const { data: event, isLoading: eventLoading } = useGetEventQuery(
    parseInt(eventId),
    {
      skip: !eventId,
    }
  );
  const { data: sessionsData, isLoading: sessionsLoading } =
    useGetSessionsQuery(
      {
        eventId: parseInt(eventId),
        dayNumber: currentDay,
      },
      {
        skip: !eventId,
      }
    );

  if (eventLoading || sessionsLoading) {
    return <div>Loading...</div>;
  }

  if (!event?.start_date || !event?.day_count) {
    return <div>Event information not available</div>;
  }

  return (
    <div className={styles.container}>
      <DateNavigation
        startDate={event.start_date}
        dayCount={event.day_count}
        currentDay={currentDay}
        onDateChange={setCurrentDay}
      />
      <AgendaView
        sessions={sessionsData?.sessions || []}
        isOrgView={isOrgView}
        orgId={orgId}
        eventId={eventId}
      />
    </div>
  );
};

export default AgendaPage;
