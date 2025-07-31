import React, { useState } from 'react';
import { Card, Text, Badge, Group, Stack, Loader } from '@mantine/core';
import { IconCalendar, IconMapPin, IconUsers, IconClock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import {
  useAcceptInvitationMutation,
  useDeclineInvitationMutation
} from '@/app/features/eventInvitations/api';
import { Button } from '@/shared/components/buttons';
import { getRoleDisplayName } from '../../../EventAdmin/AttendeesManager/schemas/attendeeSchemas';
import { formatDistanceToNow } from 'date-fns';
import styles from './styles.module.css';

export const EventInvitationCard = ({ invitation }) => {
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
        message: `You've joined ${invitation.event.title} as ${getRoleDisplayName(invitation.role)}`,
        color: 'green',
      });
      // Navigate to event page
      navigate(`/app/organizations/${invitation.event.organization.id}/events/${invitation.event.id}`);
    } catch (error) {
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
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to decline invitation',
        color: 'red',
      });
    }
    setIsProcessing(false);
  };

  const event = invitation.event;
  const invitedAgo = formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true });
  
  // Format event dates with safer parsing
  let dateInfo = 'Date TBD';
  try {
    if (event.start_date) {
      // Handle date-only strings by appending time if needed
      const startDateStr = event.start_date.includes('T') 
        ? event.start_date 
        : `${event.start_date}T00:00:00`;
      const startDate = new Date(startDateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      if (event.end_date) {
        const endDateStr = event.end_date.includes('T') 
          ? event.end_date 
          : `${event.end_date}T00:00:00`;
        const endDate = new Date(endDateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
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
    <Card className={styles.invitationCard} withBorder>
      <div className={styles.invitationBadge}>
        <Badge 
          color="pink" 
          variant="light" 
          size="sm" 
          radius="sm"
          styles={{
            root: {
              background: 'rgba(236, 72, 153, 0.08)',
              border: '1px solid rgba(236, 72, 153, 0.15)',
              color: '#ec4899',
            }
          }}
        >
          Invitation
        </Badge>
        <Text size="xs" color="dimmed">
          Invited {invitedAgo}
        </Text>
      </div>

      <Stack spacing="sm">
        <div>
          <Text size="lg" weight={600} className={styles.eventTitle}>
            {event.title}
          </Text>
          <Text size="sm" color="dimmed">
            {event.organization.name}
          </Text>
        </div>

        <Stack spacing="xs">
          <Group spacing="xs">
            <IconCalendar size={16} className={styles.icon} />
            <Text size="sm">{dateInfo}</Text>
          </Group>
          
          {event.location && (
            <Group spacing="xs">
              <IconMapPin size={16} className={styles.icon} />
              <Text size="sm">{event.location}</Text>
            </Group>
          )}
          
          <Group spacing="xs">
            <IconUsers size={16} className={styles.icon} />
            <Text size="sm">Invited as: <strong>{getRoleDisplayName(invitation.role)}</strong></Text>
          </Group>
        </Stack>

        {invitation.message && (
          <Text size="sm" className={styles.invitationMessage}>
            "{invitation.message}"
          </Text>
        )}

        <Text size="xs" color="dimmed">
          From: {invitation.invited_by?.name || 'Event Organizer'}
        </Text>

        <Group spacing="sm" className={styles.actionButtons}>
          {isProcessing ? (
            <Loader size="sm" />
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAccept}
                disabled={isProcessing}
                fullWidth
              >
                Accept Invitation
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={handleDecline}
                disabled={isProcessing}
                fullWidth
              >
                Decline
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </Card>
  );
};