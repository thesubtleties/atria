import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import { LoadingPage } from '@/shared/components/loading';
import OrganizationHeader from './OrganizationHeader';
import MembersSection from './MembersSection';
import EventsSection from './EventsSection';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { OrganizationDetail } from '@/types';

const OrganizationDashboard = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('members');

  const {
    data: organization,
    isLoading,
    error,
  } = useGetOrganizationQuery(orgId ? parseInt(orgId) : 0, { skip: !orgId });
  const typedOrganization = organization as OrganizationDetail | undefined;

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
    return <LoadingPage message='Loading organization...' />;
  }

  if (!typedOrganization) {
    return null;
  }

  return (
    <div className={cn(styles.container)}>
      {/* Background Shapes */}
      <div className={cn(styles.bgShape1)} />
      <div className={cn(styles.bgShape2)} />
      <div className={cn(styles.bgShape3)} />

      {/* Content Wrapper */}
      <div className={cn(styles.contentWrapper)}>
        {/* Header Section */}
        <OrganizationHeader
          organization={typedOrganization}
          currentUserRole={typedOrganization.current_user_role ?? 'MEMBER'}
        />

        {/* Main Content */}
        <MembersSection
          orgId={orgId}
          currentUserRole={typedOrganization.current_user_role ?? 'MEMBER'}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Events Section */}
        <EventsSection
          orgId={orgId}
          currentUserRole={typedOrganization.current_user_role ?? 'MEMBER'}
        />
      </div>
    </div>
  );
};

export default OrganizationDashboard;
