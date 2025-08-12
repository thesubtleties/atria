import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingOverlay, Alert } from '@mantine/core';
import { useGetInvitationDetailsQuery } from '../../../app/features/invitations/api';
import InvitationHeader from './components/InvitationHeader';
import AllInvitations from './components/AllInvitations';
import RegistrationForm from './components/RegistrationForm';
import ExistingUserNotice from './components/ExistingUserNotice';
import styles from './styles/index.module.css';

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [selectedInvitations, setSelectedInvitations] = useState({
    organization_ids: [],
    event_ids: []
  });

  const { data, isLoading, error } = useGetInvitationDetailsQuery(token);

  useEffect(() => {
    // Pre-select all invitations by default when data loads
    if (data?.all_invitations) {
      const orgIds = data.all_invitations.organization_invitations?.map(inv => inv.id) || [];
      const eventIds = data.all_invitations.event_invitations?.map(inv => inv.id) || [];
      
      setSelectedInvitations({
        organization_ids: orgIds,
        event_ids: eventIds
      });
    }
  }, [data]);

  const handleSelectionChange = (type, id, isSelected) => {
    setSelectedInvitations(prev => {
      const key = type === 'organization' ? 'organization_ids' : 'event_ids';
      
      if (isSelected) {
        return {
          ...prev,
          [key]: [...prev[key], id]
        };
      } else {
        return {
          ...prev,
          [key]: prev[key].filter(invId => invId !== id)
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
      <div className={styles.container}>
        {/* Background Shapes */}
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        
        <div className={styles.contentWrapper}>
          <section className={styles.loadingSection}>
            <LoadingOverlay visible />
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        {/* Background Shapes */}
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        
        <div className={styles.contentWrapper}>
          <section className={styles.errorSection}>
            <Alert color="red" title="Invalid Invitation" className={styles.errorAlert}>
              The invitation link is invalid or has expired. Please contact the person who invited you for a new invitation.
            </Alert>
          </section>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // If user exists, show redirect to login
  if (data.user_exists) {
    return (
      <div className={styles.container}>
        {/* Background Shapes */}
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        
        <div className={styles.contentWrapper}>
          <section className={styles.mainContent}>
            <ExistingUserNotice email={data.invitation.email} />
          </section>
        </div>
      </div>
    );
  }

  // Show registration form with invitations
  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />
      
      <div className={styles.contentWrapper}>
        <section className={styles.mainContent}>
          <div className={styles.pageContent}>
            <InvitationHeader invitation={data.invitation} />
            
            {data.all_invitations && (
              <AllInvitations
                invitations={data.all_invitations}
                selectedInvitations={selectedInvitations}
                onSelectionChange={handleSelectionChange}
                primaryInvitationId={
                  data.invitation.type === 'organization' 
                    ? data.invitation.organization?.id 
                    : data.invitation.event?.id
                }
              />
            )}
            
            <RegistrationForm
              email={data.invitation.email}
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