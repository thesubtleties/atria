import { useState } from 'react';
import { Badge, Text, Group } from '@mantine/core';
import { LoadingSpinner } from '../../../shared/components/loading';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import {
  useAcceptOrganizationInvitationMutation,
  useDeclineOrganizationInvitationMutation,
} from '../../../app/features/organizations/api';
import {
  useAcceptInvitationMutation as useAcceptEventInvitationMutation,
  useDeclineInvitationMutation as useDeclineEventInvitationMutation,
} from '../../../app/features/eventInvitations/api';
import { Button } from '../../../shared/components/buttons/Button';
import { formatDistanceToNow } from 'date-fns';
import { parseDateOnly } from '@/shared/hooks/formatDate';
// Helper to display role names
const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    ORGANIZER: 'Organizer',
    MEMBER: 'Member',
    SPEAKER: 'Speaker',
    ATTENDEE: 'Attendee',
  };
  return roleMap[role] || role.charAt(0) + role.slice(1).toLowerCase();
};
import type { OrganizationInvitation, EventInvitation } from './index';
import type { ApiError } from '@/types';
import styles from './styles/InvitationCard.module.css';

type InvitationCardProps = {
  invitation: OrganizationInvitation | EventInvitation;
  type: 'organization' | 'event';
};

function InvitationCard({ invitation, type }: InvitationCardProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Organization invitation mutations
  const [acceptOrgInvitation] = useAcceptOrganizationInvitationMutation();
  const [declineOrgInvitation] = useDeclineOrganizationInvitationMutation();

  // Event invitation mutations
  const [acceptEventInvitation] = useAcceptEventInvitationMutation();
  const [declineEventInvitation] = useDeclineEventInvitationMutation();

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      if (type === 'organization') {
        const orgInv = invitation as OrganizationInvitation;
        await acceptOrgInvitation(orgInv.token).unwrap();
        notifications.show({
          title: 'Invitation Accepted',
          message: `You've joined ${orgInv.organization.name} as ${getRoleDisplayName(orgInv.role)}`,
          color: 'green',
        });
        // Navigate to organization page
        navigate(`/app/organizations/${orgInv.organization.id}`);
      } else {
        const eventInv = invitation as EventInvitation;
        await acceptEventInvitation({
          token: eventInv.token,
        }).unwrap();
        notifications.show({
          title: 'Invitation Accepted',
          message: `You've joined ${eventInv.event.title} as ${getRoleDisplayName(eventInv.role)}`,
          color: 'green',
        });
        // Navigate to event page
        navigate(
          `/app/organizations/${eventInv.event.organization.id}/events/${eventInv.event.id}`,
        );
      }
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
      if (type === 'organization') {
        const orgInv = invitation as OrganizationInvitation;
        await declineOrgInvitation(orgInv.token).unwrap();
        notifications.show({
          title: 'Invitation Declined',
          message: `You've declined the invitation to ${orgInv.organization.name}`,
          color: 'gray',
        });
      } else {
        const eventInv = invitation as EventInvitation;
        await declineEventInvitation({ token: eventInv.token }).unwrap();
        notifications.show({
          title: 'Invitation Declined',
          message: `You've declined the invitation to ${eventInv.event.title}`,
          color: 'gray',
        });
      }
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

  // Format time ago
  const timeAgo = formatDistanceToNow(new Date(invitation.created_at), {
    addSuffix: true,
  });

  // Check if invitation is about to expire (within 24 hours)
  const expiresAt = new Date(invitation.expires_at);
  const hoursUntilExpiry = (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60);
  const isExpiringSoon = hoursUntilExpiry < 24 && hoursUntilExpiry > 0;

  const isOrgInvitation = type === 'organization';
  const orgInv = isOrgInvitation ? (invitation as OrganizationInvitation) : null;
  const eventInv = !isOrgInvitation ? (invitation as EventInvitation) : null;

  return (
    <div className={styles.invitationCard}>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <Badge
            color={type === 'organization' ? 'teal' : 'pink'}
            variant='light'
            radius='sm'
            styles={{
              root: {
                background:
                  type === 'organization' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(236, 72, 153, 0.08)',
                border:
                  type === 'organization' ?
                    '1px solid rgba(16, 185, 129, 0.15)'
                  : '1px solid rgba(236, 72, 153, 0.15)',
                color: type === 'organization' ? '#10b981' : '#ec4899',
              },
            }}
          >
            {type === 'organization' ? 'Organization' : 'Event'}
          </Badge>
          <Text size='sm' c='dimmed'>
            {timeAgo}
          </Text>
        </div>

        <div className={styles.cardMain}>
          <Text size='lg' className={styles.title ?? ''}>
            {orgInv ? orgInv.organization.name : eventInv?.event.title}
          </Text>

          {eventInv && (
            <Text size='sm' c='dimmed'>
              {eventInv.event.organization.name} •{' '}
              {eventInv.event.start_date ?
                (() => {
                  const date = parseDateOnly(eventInv.event.start_date);
                  return date ?
                      date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Date TBD';
                })()
              : 'Date TBD'}
            </Text>
          )}

          <Text size='sm' c='dimmed' className={styles.inviterInfo ?? ''}>
            {`Invited by ${invitation.invited_by?.name || 'Unknown'} • Role: `}
            <strong>{getRoleDisplayName(invitation.role)}</strong>
          </Text>

          {invitation.message && (
            <Text size='sm' className={styles.message ?? ''}>
              {`"${invitation.message}"`}
            </Text>
          )}

          {isExpiringSoon && (
            <Text size='xs' c='orange' fw={500}>
              Expires in {Math.floor(hoursUntilExpiry)} hours
            </Text>
          )}
        </div>
      </div>

      <Group gap='xs' className={styles.cardActions ?? ''}>
        {isProcessing ?
          <LoadingSpinner size='sm' />
        : <>
            <Button variant='primary' onClick={handleAccept} disabled={isProcessing}>
              Accept
            </Button>
            <Button variant='secondary' onClick={handleDecline} disabled={isProcessing}>
              Decline
            </Button>
          </>
        }
      </Group>
    </div>
  );
}

export default InvitationCard;
