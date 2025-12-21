import { useGetUserInvitationsQuery } from '@/app/features/users/api';
import { Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { LoadingCard } from '@/shared/components/loading';
import InvitationCard from './InvitationCard';
import styles from './styles/index.module.css';
import dashboardStyles from '../styles/index.module.css';

type InvitationsSectionProps = {
  userId: number;
};

type InvitationBase = {
  id: number;
  token: string;
  role: string;
  message?: string | null;
  created_at: string;
  expires_at: string;
  invited_by?: { name: string } | null;
};

export type OrganizationInvitation = InvitationBase & {
  organization: {
    id: number;
    name: string;
  };
};

export type EventInvitation = InvitationBase & {
  event: {
    id: number;
    title: string;
    start_date: string | null;
    organization: {
      id: number;
      name: string;
    };
  };
};

type InvitationsResponse = {
  organization_invitations: OrganizationInvitation[];
  event_invitations: EventInvitation[];
  total_count: number;
};

function InvitationsSection({ userId }: InvitationsSectionProps) {
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
        <Alert icon={<IconInfoCircle size={16} />} title='Unable to load invitations' color='red'>
          There was an error loading your invitations. Please try again later.
        </Alert>
      </section>
    );
  }

  const typedData = data as unknown as InvitationsResponse | undefined;

  // Check if there are any invitations
  const hasInvitations = typedData && typedData.total_count > 0;

  if (!hasInvitations) {
    return null; // Don't show the section if there are no invitations
  }

  return (
    <section className={`${dashboardStyles.dashboardSection} ${dashboardStyles.fullWidth}`}>
      <div className={dashboardStyles.sectionHeader}>
        <h2 className={dashboardStyles.sectionTitle}>
          Pending Invitations
          <span className={styles.invitationCount}>{typedData.total_count}</span>
        </h2>
      </div>

      <div className={styles.invitationsContainer}>
        {/* Organization Invitations */}
        {typedData.organization_invitations.map((invitation) => (
          <InvitationCard
            key={`org-${invitation.id}`}
            invitation={invitation}
            type='organization'
          />
        ))}

        {/* Event Invitations */}
        {typedData.event_invitations.map((invitation) => (
          <InvitationCard key={`event-${invitation.id}`} invitation={invitation} type='event' />
        ))}
      </div>
    </section>
  );
}

export default InvitationsSection;
