import { Text, Group, Badge, Modal, Button } from '@mantine/core';
import { IconEdit, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useState, type MouseEvent } from 'react';
import { EventModal } from '@/shared/components/modals/event/EventModal';
import { useGetEventQuery, useDeleteEventMutation } from '@/app/features/events/api';
import { useFormatDate } from '@/shared/hooks/formatDate';
import type { Event, EventDetail } from '@/types/events';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type EventCardProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: Event | Record<string, any>;
  isOrgView?: boolean;
  canEdit?: boolean;
};

export const EventCard = ({ event, isOrgView, canEdit }: EventCardProps) => {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEvent] = useDeleteEventMutation();
  const { formatDate } = useFormatDate();

  // Only fetch details if it's a single session event
  const { data: eventDetails } = useGetEventQuery(
    { id: event.id as number },
    { skip: event.event_type !== 'SINGLE_SESSION' },
  );

  const typedDetails = eventDetails as EventDetail | undefined;
  const isAdmin = typedDetails?.organizers?.some((org) => org.role === 'ADMIN');
  const hasSession = (typedDetails?.sessions?.length ?? 0) > 0;

  const cardClass =
    event.event_type === 'CONFERENCE' ? styles.cardConference : styles.cardSingleDay;
  const cardColors =
    event.event_type === 'CONFERENCE' ?
      { gradient: '#9c42f5, #6d42f5' }
    : { gradient: '#42b883, #42a5f5' };

  const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
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
      if (hasSession && typedDetails?.sessions?.[0]) {
        // Has session - go directly to it
        navigate(`${basePath}/sessions/${typedDetails.sessions[0].id}`);
      } else if (isOrgView) {
        // No session yet - route based on role (only in org view)
        const isOrganizerOrAdmin = typedDetails?.organizers?.some((org) =>
          ['ADMIN', 'ORGANIZER'].includes(org.role),
        );

        if (isOrganizerOrAdmin) {
          navigate(`${basePath}/setup-session`);
        } else {
          navigate(`${basePath}/session-pending`);
        }
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent({ id: event.id as number }).unwrap();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  // Determine if the card should be clickable
  const isClickable = isOrgView || event.event_type === 'CONFERENCE' || hasSession;

  return (
    <>
      <div
        className={cn(cardClass, !isClickable && styles.notClickable)}
        onClick={isClickable ? handleCardClick : undefined}
        style={
          {
            '--card-gradient': cardColors.gradient,
            cursor: isClickable ? 'pointer' : 'default',
          } as React.CSSProperties
        }
      >
        {canEdit && (
          <div className={cn(styles.actionButtons)}>
            <button
              className={cn(styles.editButton)}
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
                className={cn(styles.deleteButton)}
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

        <Group justify='space-between' mb='md'>
          <Text className={cn(styles.title)}>{event.title}</Text>
        </Group>

        <Text className={cn(styles.company)}>{event.company_name}</Text>

        <Text className={cn(styles.date)}>
          {formatDate(event.start_date)} - {formatDate(event.end_date)}
        </Text>

        {!isOrgView && (
          <Badge
            className={cn(styles.setupBadge)}
            color={
              event.event_type === 'CONFERENCE' ? 'blue'
              : hasSession ?
                'blue'
              : 'gray'
            }
          >
            {event.event_type === 'CONFERENCE' ?
              `${event.day_count || 1} Day Conference`
            : hasSession ?
              'Ready to Join'
            : 'Coming Soon'}
          </Badge>
        )}

        {isOrgView &&
          event.event_type === 'SINGLE_SESSION' &&
          typedDetails &&
          !typedDetails.sessions?.length && (
            <Badge className={cn(styles.setupBadge)} color={canEdit ? 'yellow' : 'gray'}>
              {canEdit ? 'Setup Required' : 'Coming Soon'}
            </Badge>
          )}
      </div>

      {showEditModal && (
        <EventModal
          event={event as Event}
          orgId={event.organization_id as number}
          opened={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}

      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title='Delete Event'
        size='sm'
        lockScroll={false}
      >
        <Text size='sm' mb='lg'>
          Are you sure you want to delete this event? This action cannot be undone.
        </Text>
        <Group justify='flex-end'>
          <Button variant='default' onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button color='red' onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
};
