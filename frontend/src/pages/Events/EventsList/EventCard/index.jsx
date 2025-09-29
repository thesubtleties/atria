// pages/Events/EventsList/EventCard/index.jsx
import { Text, Group, Badge, Modal, Button } from '@mantine/core';
import { IconEdit, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { EventModal } from '@/shared/components/modals/event/EventModal';
import {
  useGetEventQuery,
  useDeleteEventMutation,
} from '@/app/features/events/api';
import { useFormatDate } from '@/shared/hooks/formatDate';
import styles from './styles/index.module.css';

export const EventCard = ({ event, isOrgView, canEdit }) => {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEvent] = useDeleteEventMutation();
  const { formatDate } = useFormatDate();

  // Only fetch details if it's a single session event
  const { data: eventDetails } = useGetEventQuery(event.id, {
    skip: event.event_type !== 'SINGLE_SESSION',
  });

  const isAdmin = eventDetails?.organizers?.some((org) => org.role === 'ADMIN');
  const hasSession = eventDetails?.sessions?.length > 0;

  const cardClass =
    event.event_type === 'CONFERENCE'
      ? styles.cardConference
      : styles.cardSingleDay;
  const cardColors =
    event.event_type === 'CONFERENCE'
      ? { gradient: '#9c42f5, #6d42f5' }
      : { gradient: '#42b883, #42a5f5' };

  const handleCardClick = (e) => {
    e.preventDefault();

    // Always use the /app/events/:eventId path regardless of where we're viewing from
    const basePath = `/app/events/${event.id}`;

    if (event.event_type === 'CONFERENCE') {
      // Always navigate for conferences
      navigate(basePath);
      return;
    }

    // Single session logic
    if (event.event_type === 'SINGLE_SESSION') {
      if (hasSession) {
        // Has session - go directly to it
        navigate(`${basePath}/sessions/${eventDetails.sessions[0].id}`);
      } else if (isOrgView) {
        // No session yet - route based on role (only in org view)
        const isOrganizerOrAdmin = eventDetails?.organizers?.some((org) =>
          ['ADMIN', 'ORGANIZER'].includes(org.role)
        );

        if (isOrganizerOrAdmin) {
          navigate(`${basePath}/setup-session`);
        } else {
          navigate(`${basePath}/session-pending`);
        }
      }
    }
  };

  // const formatDate = (dateString) => {
  //   // Parse as UTC, then convert to local
  //   const date = parseISO(dateString);
  //   return format(date, 'M/d/yyyy');
  // };

  const handleDelete = async () => {
    try {
      await deleteEvent(event.id).unwrap();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  // Determine if the card should be clickable
  const isClickable =
    isOrgView || event.event_type === 'CONFERENCE' || hasSession;

  return (
    <>
      <div
        className={`${cardClass} ${!isClickable ? styles.notClickable : ''}`}
        onClick={isClickable ? handleCardClick : undefined}
        style={{
          '--card-gradient': cardColors.gradient,
          cursor: isClickable ? 'pointer' : 'default',
        }}
      >
        {canEdit && (
          <div className={styles.actionButtons}>
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
            {isAdmin && (
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
              >
                <IconX size={20} />
              </button>
            )}
          </div>
        )}

        <Group position="apart" mb="md">
          <Text className={styles.title}>{event.title}</Text>
        </Group>

        <Text className={styles.company}>{event.company_name}</Text>

        <Text className={styles.date}>
          {formatDate(event.start_date)} - {formatDate(event.end_date)}
        </Text>

        {!isOrgView && (
          <Badge
            className={styles.setupBadge}
            color={
              event.event_type === 'CONFERENCE'
                ? 'blue'
                : hasSession
                  ? 'blue'
                  : 'gray'
            }
          >
            {event.event_type === 'CONFERENCE'
              ? `${event.day_count || 1} Day Conference`
              : hasSession
                ? 'Ready to Join'
                : 'Coming Soon'}
          </Badge>
        )}

        {isOrgView &&
          event.event_type === 'SINGLE_SESSION' &&
          eventDetails &&
          !eventDetails.sessions?.length && (
            <Badge
              className={styles.setupBadge}
              color={canEdit ? 'yellow' : 'gray'}
            >
              {canEdit ? 'Setup Required' : 'Coming Soon'}
            </Badge>
          )}
      </div>

      {showEditModal && (
        <EventModal
          event={event}
          orgId={event.organization_id}
          opened={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}

      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Event"
        size="sm"
        lockScroll={false}
      >
        <Text size="sm" mb="lg">
          Are you sure you want to delete this event? This action cannot be
          undone.
        </Text>
        <Group position="right">
          <Button variant="default" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
};
