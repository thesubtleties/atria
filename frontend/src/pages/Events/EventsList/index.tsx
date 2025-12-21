import { useMemo } from 'react';
import { useGetUserEventsQuery, useGetUserInvitationsQuery } from '@/app/features/users/api';
import { useSelector } from 'react-redux';
import { IconCalendar, IconClock, IconHistory, IconMail } from '@tabler/icons-react';
import { LoadingSection } from '../../../shared/components/loading';
import { PageHeader } from '../../../shared/components/PageHeader';
import { EventSection } from './EventSection';
import { EmptyState } from './EmptyState';
import { categorizeEvents } from './utils/eventCategorization';
import type { RootState } from '@/types';
import type { Event } from '@/types/events';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type EventInvitation = {
  id: number;
  token: string;
  role: string;
  message?: string;
  created_at: string;
  event: {
    id: number;
    title: string;
    start_date?: string;
    end_date?: string;
    location?: string;
    organization: {
      id: number;
      name: string;
    };
  };
  invited_by?: {
    name: string;
  };
};

type EventsResponse = {
  events?: Event[];
};

type InvitationsResponse = {
  event_invitations?: EventInvitation[];
};

export const EventsList = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const { data, isLoading } = useGetUserEventsQuery(
    { userId: currentUser?.id as number },
    { skip: !currentUser?.id },
  );

  const { data: invitationsData, isLoading: invitationsLoading } = useGetUserInvitationsQuery(
    currentUser?.id as number,
    { skip: !currentUser?.id },
  );

  const typedData = data as EventsResponse | undefined;
  const typedInvitations = invitationsData as InvitationsResponse | undefined;
  const eventInvitations = typedInvitations?.event_invitations || [];

  // Filter only published events and categorize them
  const categorizedEvents = useMemo(() => {
    const events = typedData?.events || [];
    const publishedEvents = events.filter((event) => event.status?.toLowerCase() === 'published');
    return categorizeEvents(publishedEvents);
  }, [typedData?.events]);

  if (isLoading || invitationsLoading) {
    return (
      <div className={cn(styles.container)}>
        <div className={cn(styles.bgShape1)} />
        <div className={cn(styles.bgShape2)} />
        <div className={cn(styles.bgShape3)} />

        <div className={cn(styles.contentWrapper)}>
          <LoadingSection message='Loading your events...' height={400} />
        </div>
      </div>
    );
  }

  const hasAnyEvents =
    categorizedEvents.live.length > 0 ||
    categorizedEvents.upcoming.length > 0 ||
    categorizedEvents.past.length > 0;
  const hasInvitations = eventInvitations.length > 0;
  const hasAnyContent = hasAnyEvents || hasInvitations;

  return (
    <div className={cn(styles.container)}>
      {/* Background Shapes */}
      <div className={cn(styles.bgShape1)} />
      <div className={cn(styles.bgShape2)} />
      <div className={cn(styles.bgShape3)} />

      {/* Content Wrapper */}
      <div className={cn(styles.contentWrapper)}>
        <PageHeader title='Events' subtitle="Discover and join events you're invited to" />

        {/* Main Content */}
        {hasAnyContent ?
          <div className={cn(styles.eventSections)}>
            <EventSection
              icon={IconMail}
              title='Pending Invitations'
              items={eventInvitations}
              type='invitation'
            />

            <EventSection
              icon={IconClock}
              title='Events Live Now'
              items={categorizedEvents.live}
              type='event'
              status='live'
            />

            <EventSection
              icon={IconCalendar}
              title='Upcoming Events'
              items={categorizedEvents.upcoming}
              type='event'
              status='upcoming'
            />

            <EventSection
              icon={IconHistory}
              title='Past Events'
              items={categorizedEvents.past}
              type='event'
              status='past'
            />
          </div>
        : <EmptyState />}
      </div>
    </div>
  );
};
