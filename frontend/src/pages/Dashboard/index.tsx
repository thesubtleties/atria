import { useSelector } from 'react-redux';
import { Container, Text } from '@mantine/core';
import { useGetUserDashboardQuery } from '@/app/features/users/api';
import { LoadingPage } from '@/shared/components/loading';
import { ProfileHeader } from './ProfileHeader';
import { StatsSection } from './StatsSection';
import { OrganizationsSection } from './OrganizationsSection';
import { EventsSection } from './EventsSection';
import { ConnectionsSection } from './ConnectionsSection';
import { NewsSection } from './NewsSection';
import InvitationsSection from './InvitationsSection';
import type { RootState } from '@/types';
import styles from './styles/index.module.css';

export type DashboardUser = {
  id: number;
  email: string;
  full_name: string | null;
  image_url: string | null;
  title: string | null;
  company_name: string | null;
  created_at: string;
};

export type DashboardStats = {
  events_hosted: number;
  attendees_reached: number;
  connections_made: number;
  events_attended: number;
  organizations_count: number;
};

export type DashboardOrganization = {
  id: number;
  name: string;
  role: string;
  event_count: number;
  member_count: number;
};

export type DashboardEvent = {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  location: string | null;
  attendee_count: number;
  organization: {
    id: number;
    name: string;
  };
};

export type DashboardConnection = {
  id: number;
  title: string | null;
  company: string | null;
  user: {
    id: number;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export type DashboardNewsItem = {
  id: number;
  title: string;
  description: string;
  type: string;
  date: string;
  is_new: boolean;
  link?: string;
};

type DashboardData = {
  user: DashboardUser;
  stats: DashboardStats;
  organizations: DashboardOrganization[];
  events: DashboardEvent[];
  connections: DashboardConnection[];
  news: DashboardNewsItem[];
};

export const Dashboard = () => {
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  const {
    data: dashboard,
    isLoading,
    error,
  } = useGetUserDashboardQuery(userId as number, {
    skip: !userId,
  });

  if (isLoading) {
    return <LoadingPage message='Loading dashboard...' />;
  }

  if (error) {
    return (
      <Container className={styles.errorContainer ?? ''}>
        <Text c='red'>Failed to load dashboard. Please try again later.</Text>
      </Container>
    );
  }

  if (!dashboard) {
    return null;
  }

  const typedDashboard = dashboard as unknown as DashboardData;
  const { user, stats, organizations, events, connections, news } = typedDashboard;

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
      <InvitationsSection userId={userId as number} />

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
