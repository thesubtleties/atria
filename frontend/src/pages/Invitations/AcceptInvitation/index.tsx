import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingOverlay, Alert } from '@mantine/core';
import { useGetInvitationDetailsQuery } from '../../../app/features/invitations/api';
import InvitationHeader from './components/InvitationHeader';
import AllInvitations from './components/AllInvitations';
import RegistrationForm from './components/RegistrationForm';
import ExistingUserNotice from './components/ExistingUserNotice';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

export type SelectedInvitations = {
  organization_ids: number[];
  event_ids: number[];
};

export type InvitedBy = {
  name: string;
};

export type OrganizationRef = {
  id: number;
  name: string;
};

export type EventRef = {
  id: number;
  title: string;
  organization: OrganizationRef;
};

export type OrganizationInvitationDetail = {
  id: number;
  organization_id: number;
  email: string;
  role: string;
  status: string;
  message?: string | null;
  created_at: string;
  expires_at: string;
  organization: OrganizationRef;
  invited_by?: InvitedBy | null;
};

export type EventInvitationDetail = {
  id: number;
  event_id: number;
  organization_id: number;
  email: string;
  role: string;
  status: string;
  message?: string | null;
  created_at: string;
  expires_at: string;
  event: EventRef;
  invited_by?: InvitedBy | null;
};

export type AllInvitationsData = {
  organization_invitations: OrganizationInvitationDetail[];
  event_invitations: EventInvitationDetail[];
};

export type PrimaryInvitation = {
  type: 'organization' | 'event';
  email: string;
  role: string;
  message?: string | null;
  invited_by?: InvitedBy | null;
  organization?: OrganizationRef;
  event?: EventRef;
};

type InvitationDetailsResponse = {
  invitation: PrimaryInvitation;
  user_exists: boolean;
  all_invitations: AllInvitationsData | null;
};

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [selectedInvitations, setSelectedInvitations] = useState<SelectedInvitations>({
    organization_ids: [],
    event_ids: [],
  });

  const { data, isLoading, error } = useGetInvitationDetailsQuery(
    { token: token || '' },
    { skip: !token },
  );

  // Cast to our expected response type
  const typedData = data as unknown as InvitationDetailsResponse | undefined;

  useEffect(() => {
    // Pre-select all invitations by default when data loads
    if (typedData?.all_invitations) {
      const orgIds = typedData.all_invitations.organization_invitations?.map((inv) => inv.id) || [];
      const eventIds = typedData.all_invitations.event_invitations?.map((inv) => inv.id) || [];

      setSelectedInvitations({
        organization_ids: orgIds,
        event_ids: eventIds,
      });
    }
  }, [typedData]);

  const handleSelectionChange = (
    type: 'organization' | 'event',
    id: number,
    isSelected: boolean,
  ) => {
    setSelectedInvitations((prev) => {
      const key = type === 'organization' ? 'organization_ids' : 'event_ids';

      if (isSelected) {
        return {
          ...prev,
          [key]: [...prev[key], id],
        };
      } else {
        return {
          ...prev,
          [key]: prev[key].filter((invId) => invId !== id),
        };
      }
    });
  };

  const handleRegistrationSuccess = () => {
    // Navigate to dashboard after successful registration
    navigate('/app/dashboard');
  };

  if (isLoading) {
    return (
      <div className={cn(styles.container)}>
        {/* Background Shapes */}
        <div className={cn(styles.bgShape1)} />
        <div className={cn(styles.bgShape2)} />

        <div className={cn(styles.contentWrapper)}>
          <section className={cn(styles.loadingSection)}>
            <LoadingOverlay visible />
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(styles.container)}>
        {/* Background Shapes */}
        <div className={cn(styles.bgShape1)} />
        <div className={cn(styles.bgShape2)} />

        <div className={cn(styles.contentWrapper)}>
          <section className={cn(styles.errorSection)}>
            <Alert color='red' title='Invalid Invitation' className={cn(styles.errorAlert)}>
              The invitation link is invalid or has expired. Please contact the person who invited
              you for a new invitation.
            </Alert>
          </section>
        </div>
      </div>
    );
  }

  if (!typedData) {
    return null;
  }

  // If user exists, show redirect to login
  if (typedData.user_exists) {
    return (
      <div className={cn(styles.container)}>
        {/* Background Shapes */}
        <div className={cn(styles.bgShape1)} />
        <div className={cn(styles.bgShape2)} />

        <div className={cn(styles.contentWrapper)}>
          <section className={cn(styles.mainContent)}>
            <ExistingUserNotice email={typedData.invitation.email} />
          </section>
        </div>
      </div>
    );
  }

  // Show registration form with invitations
  return (
    <div className={cn(styles.container)}>
      {/* Background Shapes */}
      <div className={cn(styles.bgShape1)} />
      <div className={cn(styles.bgShape2)} />

      <div className={cn(styles.contentWrapper)}>
        <section className={cn(styles.mainContent)}>
          <div className={cn(styles.pageContent)}>
            <InvitationHeader invitation={typedData.invitation} />

            {typedData.all_invitations && (
              <AllInvitations
                invitations={typedData.all_invitations}
                selectedInvitations={selectedInvitations}
                onSelectionChange={handleSelectionChange}
                primaryInvitationId={
                  typedData.invitation.type === 'organization' ?
                    typedData.invitation.organization?.id
                  : typedData.invitation.event?.id
                }
              />
            )}

            <RegistrationForm
              email={typedData.invitation.email}
              selectedInvitations={selectedInvitations}
              onSuccess={handleRegistrationSuccess}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AcceptInvitation;
