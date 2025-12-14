// pages/Agenda/index.jsx
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useGetEventQuery } from '../../app/features/events/api';
import { useGetSessionsQuery } from '../../app/features/sessions/api';
import { LoadingSection } from '../../shared/components/loading';
import { DateNavigation } from './DateNavigation';
import { AgendaView } from './AgendaView';
import { useEffect } from 'react';
import styles from './styles/index.module.css';

export const AgendaPage = () => {
  const { eventId, orgId } = useParams();
  const location = useLocation();
  const isOrgView = location.pathname.includes('/organizations/');
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current day from URL params, default to 1
  const dayParam = parseInt(searchParams.get('day') || '1');
  const currentDay = isNaN(dayParam) || dayParam < 1 ? 1 : dayParam;

  const { data: event, isLoading: eventLoading } = useGetEventQuery(parseInt(eventId), {
    skip: !eventId,
  });
  const { data: sessionsData, isLoading: sessionsLoading } = useGetSessionsQuery(
    {
      eventId: parseInt(eventId),
      dayNumber: currentDay,
    },
    {
      skip: !eventId,
    },
  );

  // Validate and correct day parameter if it exceeds event's day count
  useEffect(() => {
    if (event?.day_count && currentDay > event.day_count) {
      setSearchParams({ day: '1' });
    }
  }, [event?.day_count, currentDay, setSearchParams]);

  if (eventLoading || sessionsLoading) {
    return <LoadingSection message='Loading event agenda...' height={400} />;
  }

  if (!event?.start_date || !event?.day_count) {
    return <div>Event information not available</div>;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Animated background shapes */}
      <div className={styles.animatedShape1} />
      <div className={styles.animatedShape2} />
      <div className={styles.animatedShape3} />

      <div className={styles.contentWrapper}>
        <DateNavigation
          startDate={event.start_date}
          dayCount={event.day_count}
          currentDay={currentDay}
          onDateChange={(day) => setSearchParams({ day: day.toString() })}
        />
        <AgendaView
          sessions={sessionsData?.sessions || []}
          eventStartDate={event.start_date}
          eventTimezone={event.timezone || 'UTC'}
          isOrgView={isOrgView}
          orgId={orgId}
          eventId={eventId}
        />
      </div>
    </div>
  );
};

export default AgendaPage;
