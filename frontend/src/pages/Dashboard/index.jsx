import { useSelector } from 'react-redux';
import { Container, Text } from '@mantine/core';
import { useGetUserDashboardQuery } from '@/app/features/users/api';
import { LoadingPage } from '../../shared/components/loading';
import { ProfileHeader } from './ProfileHeader';
import { StatsSection } from './StatsSection';
import { OrganizationsSection } from './OrganizationsSection';
import { EventsSection } from './EventsSection';
import { ConnectionsSection } from './ConnectionsSection';
import { NewsSection } from './NewsSection';
import InvitationsSection from './InvitationsSection';
import styles from './styles/index.module.css';

export const Dashboard = () => {
  const userId = useSelector((state) => state.auth.user?.id);

  const {
    data: dashboard,
    isLoading,
    error,
  } = useGetUserDashboardQuery(userId, {
    skip: !userId,
  });

  if (isLoading) {
    return <LoadingPage message='Loading dashboard...' />;
  }

  if (error) {
    return (
      <Container className={styles.errorContainer}>
        <Text color='red'>Failed to load dashboard. Please try again later.</Text>
      </Container>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { user, stats, organizations, events, connections, news } = dashboard;

  return (
    <div className={styles.dashboard}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Dashboard Stats */}
      <StatsSection stats={stats} />

      {/* Invitations */}
      <InvitationsSection userId={userId} />

      <div className={styles.dashboardGrid}>
        {/* Organizations */}
        <OrganizationsSection organizations={organizations} />

        {/* Events */}
        <EventsSection events={events} />

        {/* Recent Connections */}
        <ConnectionsSection connections={connections} />

        {/* News */}
        <NewsSection news={news} />
      </div>
    </div>
  );
};
