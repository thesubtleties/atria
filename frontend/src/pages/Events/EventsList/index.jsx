// src/pages/Events/EventsList/index.jsx
import { useMemo } from 'react';
import { useGetUserEventsQuery, useGetUserInvitationsQuery } from '@/app/features/users/api';
import { Text, LoadingOverlay } from '@mantine/core';
import { useSelector } from 'react-redux';
import { IconCalendar, IconClock, IconHistory, IconMail } from '@tabler/icons-react';
import { AttendeeEventCard } from './AttendeeEventCard';
import { EventInvitationCard } from './EventInvitationCard';
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

  const events = data?.events || [];
  const eventInvitations = invitationsData?.event_invitations || [];

  // Filter only published events and categorize them
  const categorizedEvents = useMemo(() => {
    const publishedEvents = events.filter(event => event.status?.toLowerCase() === 'published');
    return categorizeEvents(publishedEvents);
  }, [events]);

  if (isLoading || invitationsLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        <div className={styles.bgShape3} />
        
        <div className={styles.contentWrapper}>
          <LoadingOverlay visible />
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
        {/* Header Section */}
        <section className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Events</h1>
          <p className={styles.subtitle}>Discover and join events you're invited to</p>
        </section>

        {/* Main Content */}
        {hasAnyContent ? (
          <div className={styles.eventSections}>
            {/* Event Invitations */}
            {hasInvitations && (
              <section className={styles.eventCategory}>
                <div className={styles.categoryHeader}>
                  <IconMail size={24} className={styles.categoryIcon} />
                  <h2 className={styles.categoryTitle}>Pending Invitations</h2>
                  <span className={styles.eventCount}>{eventInvitations.length}</span>
                </div>
                <div className={styles.eventsGrid}>
                  {eventInvitations.map((invitation) => (
                    <EventInvitationCard key={invitation.id} invitation={invitation} />
                  ))}
                </div>
              </section>
            )}

            {/* Live Events */}
            {categorizedEvents.live.length > 0 && (
              <section className={styles.eventCategory}>
                <div className={styles.categoryHeader}>
                  <IconClock size={24} className={styles.categoryIcon} />
                  <h2 className={styles.categoryTitle}>Events Live Now</h2>
                  <span className={styles.eventCount}>{categorizedEvents.live.length}</span>
                </div>
                <div className={styles.eventsGrid}>
                  {categorizedEvents.live.map((event) => (
                    <AttendeeEventCard key={event.id} event={event} status="live" />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Events */}
            {categorizedEvents.upcoming.length > 0 && (
              <section className={styles.eventCategory}>
                <div className={styles.categoryHeader}>
                  <IconCalendar size={24} className={styles.categoryIcon} />
                  <h2 className={styles.categoryTitle}>Upcoming Events</h2>
                  <span className={styles.eventCount}>{categorizedEvents.upcoming.length}</span>
                </div>
                <div className={styles.eventsGrid}>
                  {categorizedEvents.upcoming.map((event) => (
                    <AttendeeEventCard key={event.id} event={event} status="upcoming" />
                  ))}
                </div>
              </section>
            )}

            {/* Past Events */}
            {categorizedEvents.past.length > 0 && (
              <section className={styles.eventCategory}>
                <div className={styles.categoryHeader}>
                  <IconHistory size={24} className={styles.categoryIcon} />
                  <h2 className={styles.categoryTitle}>Past Events</h2>
                  <span className={styles.eventCount}>{categorizedEvents.past.length}</span>
                </div>
                <div className={styles.eventsGrid}>
                  {categorizedEvents.past.map((event) => (
                    <AttendeeEventCard key={event.id} event={event} status="past" />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className={styles.emptyStateContainer}>
            <div className={styles.emptyState}>
              <IconCalendar size={64} className={styles.emptyIcon} stroke={1.5} />
              <Text size="xl" weight={600} className={styles.emptyTitle}>
                No Events Yet
              </Text>
              <Text size="md" className={styles.emptyText}>
                You haven't been invited to any events.
              </Text>
              <Text size="md" className={styles.emptyText}>
                When organizations invite you to their events, they'll appear here.
              </Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
