// src/pages/Events/EventsList/index.jsx
import { useMemo } from 'react';
import { useGetUserEventsQuery, useGetUserInvitationsQuery } from '@/app/features/users/api';
import { useSelector } from 'react-redux';
import { IconCalendar, IconClock, IconHistory, IconMail } from '@tabler/icons-react';
import { LoadingSection } from '../../../shared/components/loading';
import { PageHeader } from '../../../shared/components/PageHeader';
import { EventSection } from './EventSection';
import { EmptyState } from './EmptyState';
import { categorizeEvents } from './utils/eventCategorization';
import styles from './styles/index.module.css';

export const EventsList = () => {
  const currentUser = useSelector((state) => state.auth.user);

  const { data, isLoading } = useGetUserEventsQuery(
    { userId: currentUser?.id },
    { skip: !currentUser?.id }
  );

  const { data: invitationsData, isLoading: invitationsLoading } = useGetUserInvitationsQuery(
    currentUser?.id,
    { skip: !currentUser?.id }
  );

  const eventInvitations = invitationsData?.event_invitations || [];

  // Filter only published events and categorize them
  const categorizedEvents = useMemo(() => {
    const events = data?.events || [];
    const publishedEvents = events.filter(event => event.status?.toLowerCase() === 'published');
    return categorizeEvents(publishedEvents);
  }, [data?.events]);

  if (isLoading || invitationsLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        <div className={styles.bgShape3} />

        <div className={styles.contentWrapper}>
          <LoadingSection message="Loading your events..." height={400} />
        </div>
      </div>
    );
  }

  const hasAnyEvents = categorizedEvents.live.length > 0 ||
                      categorizedEvents.upcoming.length > 0 ||
                      categorizedEvents.past.length > 0;
  const hasInvitations = eventInvitations.length > 0;
  const hasAnyContent = hasAnyEvents || hasInvitations;

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />
      <div className={styles.bgShape3} />

      {/* Content Wrapper */}
      <div className={styles.contentWrapper}>
        <PageHeader
          title="Events"
          subtitle="Discover and join events you're invited to"
        />

        {/* Main Content */}
        {hasAnyContent ? (
          <div className={styles.eventSections}>
            <EventSection
              icon={IconMail}
              title="Pending Invitations"
              items={eventInvitations}
              type="invitation"
            />

            <EventSection
              icon={IconClock}
              title="Events Live Now"
              items={categorizedEvents.live}
              type="event"
              status="live"
            />

            <EventSection
              icon={IconCalendar}
              title="Upcoming Events"
              items={categorizedEvents.upcoming}
              type="event"
              status="upcoming"
            />

            <EventSection
              icon={IconHistory}
              title="Past Events"
              items={categorizedEvents.past}
              type="event"
              status="past"
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};