// pages/Events/EventsList/EventCard/index.jsx
import { Text, Group, Badge } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { EventModal } from '@/shared/components/modals/event/EventModal';
import { useGetEventQuery } from '@/app/features/events/api';
import { format, parseISO } from 'date-fns';
import styles from './styles/index.module.css';

export const EventCard = ({ event, isOrgView, canEdit }) => {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);

  // Only fetch details if it's a single session event
  const { data: eventDetails } = useGetEventQuery(event.id, {
    skip: event.event_type !== 'SINGLE_SESSION',
  });

  const cardClass =
    event.event_type === 'CONFERENCE'
      ? styles.cardConference
      : styles.cardSingleDay;
  const cardColors =
    event.event_type === 'CONFERENCE'
      ? { gradient: '#9c42f5, #6d42f5' }
      : { gradient: '#42b883, #42a5f5' };

  const handleCardClick = (e) => {
    e.preventDefault(); // Prevent default Link behavior

    if (event.event_type === 'SINGLE_SESSION') {
      const basePath = isOrgView
        ? `/app/organizations/${event.organization_id}/events/${event.id}`
        : `/app/events/${event.id}`;

      if (eventDetails?.sessions?.length > 0) {
        // Has session - go directly to it
        navigate(`${basePath}/sessions/${eventDetails.sessions[0].id}`);
      } else {
        // No session yet - route based on role
        const isOrganizerOrAdmin = eventDetails?.organizers?.some((org) =>
          ['ADMIN', 'ORGANIZER'].includes(org.role)
        );

        if (isOrganizerOrAdmin) {
          navigate(`${basePath}/setup-session`);
        } else {
          navigate(`${basePath}/session-pending`);
        }
      }
    } else {
      // Conference - use default routing
      navigate(
        isOrgView
          ? `/app/organizations/${event.organization_id}/events/${event.id}`
          : `/app/events/${event.id}`
      );
    }
  };
  const formatDate = (dateString) => {
    // Parse the ISO string and format it, preserving the date regardless of timezone
    const date = new Date(dateString);
    return format(
      new Date(date.getTime() + date.getTimezoneOffset() * 60000),
      'M/d/yyyy'
    );
  };

  return (
    <>
      <Link
        to="#"
        onClick={handleCardClick}
        className={cardClass}
        style={{
          '--card-gradient': cardColors.gradient,
        }}
      >
        {canEdit && (
          <button
            className={styles.editButton}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowEditModal(true);
            }}
          >
            <IconEdit size={20} />
          </button>
        )}

        <Group position="apart" mb="md">
          <Text className={styles.title}>{event.title}</Text>
        </Group>

        <Text className={styles.company}>{event.company_name}</Text>

        <Text className={styles.date}>
          {formatDate(event.start_date)} - {formatDate(event.end_date)}
        </Text>

        {/* Moved badge here, after other content */}
        {event.event_type === 'SINGLE_SESSION' &&
          eventDetails &&
          !eventDetails.sessions?.length && (
            <Badge
              className={styles.setupBadge}
              color={canEdit ? 'yellow' : 'gray'}
            >
              {canEdit ? 'Setup Required' : 'Coming Soon'}
            </Badge>
          )}
      </Link>

      {showEditModal && (
        <EventModal
          event={event}
          orgId={event.organization_id}
          opened={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
};
