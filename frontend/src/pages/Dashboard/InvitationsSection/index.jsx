import React from 'react';
import { useGetUserInvitationsQuery } from '../../../app/features/users/api';
import { Alert, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { LoadingCard } from '../../../shared/components/loading';
import InvitationCard from './InvitationCard';
import styles from './styles/index.module.css';
import dashboardStyles from '../styles/index.module.css';

function InvitationsSection({ userId }) {
  const { data, isLoading, error } = useGetUserInvitationsQuery(userId);

  if (isLoading) {
    return (
      <section className={`${dashboardStyles.dashboardSection} ${dashboardStyles.fullWidth}`}>
        <div className={dashboardStyles.sectionHeader}>
          <h2 className={dashboardStyles.sectionTitle}>Pending Invitations</h2>
        </div>
        <div className={styles.invitationsContainer}>
          <LoadingCard />
          <LoadingCard />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${dashboardStyles.dashboardSection} ${dashboardStyles.fullWidth}`}>
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          title="Unable to load invitations" 
          color="red"
        >
          There was an error loading your invitations. Please try again later.
        </Alert>
      </section>
    );
  }

  // Check if there are any invitations
  const hasInvitations = data && data.total_count > 0;

  if (!hasInvitations) {
    return null; // Don't show the section if there are no invitations
  }

  return (
    <section className={`${dashboardStyles.dashboardSection} ${dashboardStyles.fullWidth}`}>
      <div className={dashboardStyles.sectionHeader}>
        <h2 className={dashboardStyles.sectionTitle}>
          Pending Invitations
          <span className={styles.invitationCount}>{data.total_count}</span>
        </h2>
      </div>
      
      <div className={styles.invitationsContainer}>
        {/* Organization Invitations */}
        {data.organization_invitations.map((invitation) => (
          <InvitationCard
            key={`org-${invitation.id}`}
            invitation={invitation}
            type="organization"
            userId={userId}
          />
        ))}
        
        {/* Event Invitations */}
        {data.event_invitations.map((invitation) => (
          <InvitationCard
            key={`event-${invitation.id}`}
            invitation={invitation}
            type="event"
            userId={userId}
          />
        ))}
      </div>
    </section>
  );
}

export default InvitationsSection;