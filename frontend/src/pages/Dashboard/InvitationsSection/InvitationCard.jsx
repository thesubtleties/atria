import React, { useState } from 'react';
import { Badge, Text, Group, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { 
  useAcceptOrganizationInvitationMutation, 
  useDeclineOrganizationInvitationMutation 
} from '../../../app/features/organizations/api';
import { 
  useAcceptInvitationMutation as useAcceptEventInvitationMutation,
  useDeclineInvitationMutation as useDeclineEventInvitationMutation
} from '../../../app/features/eventInvitations/api';
import { Button } from '../../../shared/components/buttons/Button';
import { formatDistanceToNow } from 'date-fns';
import { getRoleDisplayName } from '../../EventAdmin/AttendeesManager/schemas/attendeeSchemas';
import styles from './styles/InvitationCard.module.css';

function InvitationCard({ invitation, type, userId }) {
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
      let result;
      if (type === 'organization') {
        result = await acceptOrgInvitation(invitation.token).unwrap();
        notifications.show({
          title: 'Invitation Accepted',
          message: `You've joined ${invitation.organization.name} as ${getRoleDisplayName(invitation.role)}`,
          color: 'green',
        });
        // Navigate to organization page
        navigate(`/app/organizations/${invitation.organization.id}`);
      } else {
        result = await acceptEventInvitation({ token: invitation.token }).unwrap();
        notifications.show({
          title: 'Invitation Accepted',
          message: `You've joined ${invitation.event.title} as ${getRoleDisplayName(invitation.role)}`,
          color: 'green',
        });
        // Navigate to event page
        navigate(`/app/organizations/${invitation.event.organization.id}/events/${invitation.event.id}`);
      }
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
      if (type === 'organization') {
        await declineOrgInvitation(invitation.token).unwrap();
        notifications.show({
          title: 'Invitation Declined',
          message: `You've declined the invitation to ${invitation.organization.name}`,
          color: 'gray',
        });
      } else {
        await declineEventInvitation({ token: invitation.token }).unwrap();
        notifications.show({
          title: 'Invitation Declined',
          message: `You've declined the invitation to ${invitation.event.title}`,
          color: 'gray',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to decline invitation',
        color: 'red',
      });
    }
    setIsProcessing(false);
  };

  // Format time ago
  const timeAgo = formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true });
  
  // Check if invitation is about to expire (within 24 hours)
  const expiresAt = new Date(invitation.expires_at);
  const hoursUntilExpiry = (expiresAt - new Date()) / (1000 * 60 * 60);
  const isExpiringSoon = hoursUntilExpiry < 24 && hoursUntilExpiry > 0;

  return (
    <div className={styles.invitationCard}>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <Badge 
            color={type === 'organization' ? 'teal' : 'pink'} 
            variant="light"
            radius="sm"
            styles={{
              root: {
                background: type === 'organization' 
                  ? 'rgba(16, 185, 129, 0.08)' 
                  : 'rgba(236, 72, 153, 0.08)',
                border: type === 'organization'
                  ? '1px solid rgba(16, 185, 129, 0.15)'
                  : '1px solid rgba(236, 72, 153, 0.15)',
                color: type === 'organization'
                  ? '#10b981'
                  : '#ec4899',
              }
            }}
          >
            {type === 'organization' ? 'Organization' : 'Event'}
          </Badge>
          <Text size="sm" color="dimmed">{timeAgo}</Text>
        </div>
        
        <div className={styles.cardMain}>
          <Text size="lg" className={styles.title}>
            {type === 'organization' 
              ? invitation.organization.name 
              : invitation.event.title}
          </Text>
          
          {type === 'event' && (
            <Text size="sm" color="dimmed">
              {invitation.event.organization.name} • {
                invitation.event.start_date 
                  ? new Date(invitation.event.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric', 
                      year: 'numeric'
                    })
                  : 'Date TBD'
              }
            </Text>
          )}
          
          <Text size="sm" color="dimmed" className={styles.inviterInfo}>
            Invited by {invitation.invited_by?.name || 'Unknown'} • Role: <strong>{getRoleDisplayName(invitation.role)}</strong>
          </Text>
          
          {invitation.message && (
            <Text size="sm" className={styles.message}>
              "{invitation.message}"
            </Text>
          )}
          
          {isExpiringSoon && (
            <Text size="xs" color="orange" weight={500}>
              Expires in {Math.floor(hoursUntilExpiry)} hours
            </Text>
          )}
        </div>
      </div>
      
      <Group spacing="xs" className={styles.cardActions}>
        {isProcessing ? (
          <Loader size="sm" />
        ) : (
          <>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleAccept}
              disabled={isProcessing}
            >
              Accept
            </Button>
            <Button 
              variant="subtle" 
              size="sm"
              onClick={handleDecline}
              disabled={isProcessing}
            >
              Decline
            </Button>
          </>
        )}
      </Group>
    </div>
  );
}

export default InvitationCard;