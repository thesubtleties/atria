import { useState } from 'react';
import { Card, Text, Badge, Group, Stack } from '@mantine/core';
import { LoadingSpinner } from '@/shared/components/loading';
import { IconCalendar, IconMapPin, IconUsers } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import {
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
} from '@/app/features/eventInvitations/api';
import { Button } from '@/shared/components/buttons';
import { formatDistanceToNow } from 'date-fns';
import type { ApiError } from '@/types';
import { cn } from '@/lib/cn';
import styles from './styles.module.css';

// Format role display name
const formatRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    ADMIN: 'Admin',
    ORGANIZER: 'Organizer',
    SPEAKER: 'Speaker',
    ATTENDEE: 'Attendee',
    MEMBER: 'Member',
  };
  return roleMap[role.toUpperCase()] || role;
};

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

type EventInvitationCardProps = {
  invitation: EventInvitation;
};

export const EventInvitationCard = ({ invitation }: EventInvitationCardProps) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const [acceptInvitation] = useAcceptInvitationMutation();
  const [declineInvitation] = useDeclineInvitationMutation();

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await acceptInvitation({ token: invitation.token }).unwrap();
      notifications.show({
        title: 'Invitation Accepted',
        message: `You've joined ${invitation.event.title} as ${formatRoleDisplayName(invitation.role)}`,
        color: 'green',
      });
      // Navigate to event page
      navigate(
        `/app/organizations/${invitation.event.organization.id}/events/${invitation.event.id}`,
      );
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to accept invitation',
        color: 'red',
      });
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await declineInvitation({ token: invitation.token }).unwrap();
      notifications.show({
        title: 'Invitation Declined',
        message: `You've declined the invitation to ${invitation.event.title}`,
        color: 'gray',
      });
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to decline invitation',
        color: 'red',
      });
    }
    setIsProcessing(false);
  };

  const event = invitation.event;
  const invitedAgo = formatDistanceToNow(new Date(invitation.created_at), {
    addSuffix: true,
  });

  // Format event dates with safer parsing
  let dateInfo = 'Date TBD';
  try {
    if (event.start_date) {
      // Handle date-only strings by appending time if needed
      const startDateStr =
        event.start_date.includes('T') ? event.start_date : `${event.start_date}T00:00:00`;
      const startDate = new Date(startDateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (event.end_date) {
        const endDateStr =
          event.end_date.includes('T') ? event.end_date : `${event.end_date}T00:00:00`;
        const endDate = new Date(endDateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        dateInfo = startDate !== endDate ? `${startDate} - ${endDate}` : startDate;
      } else {
        dateInfo = startDate;
      }
    }
  } catch (error) {
    console.error('Error formatting event date:', error);
    dateInfo = 'Date TBD';
  }

  return (
    <Card className={cn(styles.invitationCard)} withBorder>
      <div className={cn(styles.invitationBadge)}>
        <Badge
          color='pink'
          variant='light'
          size='sm'
          radius='sm'
          styles={{
            root: {
              background: 'rgba(236, 72, 153, 0.08)',
              border: '1px solid rgba(236, 72, 153, 0.15)',
              color: '#ec4899',
            },
          }}
        >
          Invitation
        </Badge>
        <Text size='xs' c='dimmed'>
          Invited {invitedAgo}
        </Text>
      </div>

      <Stack gap='sm'>
        <div>
          <Text size='lg' fw={600} className={cn(styles.eventTitle)}>
            {event.title}
          </Text>
          <Text size='sm' c='dimmed'>
            {event.organization.name}
          </Text>
        </div>

        <Stack gap='xs'>
          <Group gap='xs'>
            <IconCalendar size={16} className={cn(styles.icon)} />
            <Text size='sm'>{dateInfo}</Text>
          </Group>

          {event.location && (
            <Group gap='xs'>
              <IconMapPin size={16} className={cn(styles.icon)} />
              <Text size='sm'>{event.location}</Text>
            </Group>
          )}

          <Group gap='xs'>
            <IconUsers size={16} className={cn(styles.icon)} />
            <Text size='sm'>
              Invited as: <strong>{formatRoleDisplayName(invitation.role)}</strong>
            </Text>
          </Group>
        </Stack>

        {invitation.message && (
          <Text size='sm' className={cn(styles.invitationMessage)}>
            {`"${invitation.message}"`}
          </Text>
        )}

        <Text size='xs' c='dimmed'>
          From: {invitation.invited_by?.name || 'Event Organizer'}
        </Text>

        <Group gap='sm' className={cn(styles.actionButtons)}>
          {isProcessing ?
            <LoadingSpinner size='sm' />
          : <>
              <Button variant='primary' onClick={handleAccept} disabled={isProcessing}>
                Accept Invitation
              </Button>
              <Button variant='secondary' onClick={handleDecline} disabled={isProcessing}>
                Decline
              </Button>
            </>
          }
        </Group>
      </Stack>
    </Card>
  );
};
