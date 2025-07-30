import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingOverlay } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useGetOrganizationQuery } from '../../../app/features/organizations/api';
import OrganizationHeader from './OrganizationHeader';
import MembersSection from './MembersSection';
import EventsSection from './EventsSection';
import styles from './styles/index.module.css';

const OrganizationDashboard = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('members');

  const { data: organization, isLoading, error } = useGetOrganizationQuery(orgId);

  useEffect(() => {
    if (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load organization details',
        color: 'red',
      });
      navigate('/app/dashboard');
    }
  }, [error, navigate]);

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (!organization) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />
      <div className={styles.bgShape3} />

      {/* Content Wrapper */}
      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <OrganizationHeader 
          organization={organization} 
          currentUserRole={organization.current_user_role}
        />

        {/* Main Content */}
        <MembersSection 
          orgId={orgId}
          organization={organization}
          currentUserRole={organization.current_user_role}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Events Section */}
        <EventsSection
          orgId={orgId}
          currentUserRole={organization.current_user_role}
        />
      </div>
    </div>
  );
};

export default OrganizationDashboard;