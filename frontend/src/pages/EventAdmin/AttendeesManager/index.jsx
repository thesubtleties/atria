import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Group,
  TextInput,
  Select,
  LoadingOverlay,
  Tabs,
  Badge,
  ActionIcon,
  Menu,
  Text,
  Pagination,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconDownload,
  IconUpload,
  IconFilter,
  IconDots,
  IconUsers,
  IconMail,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useGetEventInvitationsQuery,
} from '../../../app/features/eventInvitations/api';
import { 
  useGetEventQuery,
  useGetEventUsersAdminQuery,
} from '../../../app/features/events/api';
import { Button } from '../../../shared/components/buttons';
import AttendeesList from './AttendeesList';
import PendingInvitations from './PendingInvitations';
import InviteModal from './InviteModal';
import RoleUpdateModal from './RoleUpdateModal';
import styles from './styles/index.module.css';

const AttendeesManager = () => {
  const { eventId } = useParams();
  const [activeTab, setActiveTab] = useState('attendees');
  
  const handleTabChange = (value) => {
    setActiveTab(value);
    // Reset pagination when switching tabs
    if (value === 'invitations') {
      setInvitationsPage(1);
    } else {
      setPage(1);
    }
  };
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [roleUpdateModal, setRoleUpdateModal] = useState({ open: false, user: null });
  const [filters, setFilters] = useState({
    search: '',
    role: 'ALL',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Get current user info
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.id;
  
  // Fetch event details to get current user's role
  const { data: eventData } = useGetEventQuery(eventId);
  const currentUserRole = eventData?.user_role || 'ATTENDEE';

  // Fetch attendees with pagination (using admin endpoint for email/full name access)
  const [page, setPage] = useState(1);
  const {
    data: attendeesData,
    isLoading: isLoadingAttendees,
    error: attendeesError,
    refetch: refetchAttendees,
  } = useGetEventUsersAdminQuery({
    eventId,
    page,
    per_page: 50,
    role: filters.role !== 'ALL' ? filters.role : undefined,
  });

  // Fetch pending invitations with pagination
  const [invitationsPage, setInvitationsPage] = useState(1);
  const {
    data: invitationsData,
    isLoading: isLoadingInvitations,
    refetch: refetchInvitations,
  } = useGetEventInvitationsQuery({ 
    eventId, 
    page: invitationsPage,
    perPage: 50,
  });

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleRoleFilter = (value) => {
    setFilters((prev) => ({ ...prev, role: value }));
    setPage(1);
  };

  const handleSort = (field) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    notifications.show({
      title: 'Export Started',
      message: 'Preparing attendee list for download...',
      color: 'blue',
    });
  };

  const handleImport = () => {
    // TODO: Implement CSV import modal
    notifications.show({
      title: 'Import',
      message: 'CSV import feature coming soon',
      color: 'yellow',
    });
  };


  const filteredAttendees = attendeesData?.event_users?.filter((user) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.company_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const sortedAttendees = [...filteredAttendees].sort((a, b) => {
    let aVal, bVal;
    switch (filters.sortBy) {
      case 'name':
        aVal = a.full_name || '';
        bVal = b.full_name || '';
        break;
      case 'email':
        aVal = a.email || '';
        bVal = b.email || '';
        break;
      case 'company':
        aVal = a.company_name || '';
        bVal = b.company_name || '';
        break;
      case 'joinDate':
        aVal = a.created_at || '';
        bVal = b.created_at || '';
        break;
      case 'role':
        aVal = a.role || '';
        bVal = b.role || '';
        break;
      default:
        aVal = a.full_name || '';
        bVal = b.full_name || '';
    }

    if (filters.sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Use role counts from backend if available, otherwise calculate from current page
  const roleCounts = attendeesData?.role_counts || 
    attendeesData?.event_users?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {}) || { total: 0 };

  if (attendeesError) {
    return (
      <div className={styles.container}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        
        <div className={styles.contentWrapper}>
          <section className={styles.mainContent}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Text c="red" size="lg" mb="md">
                Error loading attendees: {attendeesError.message}
              </Text>
              <Button 
                variant="primary"
                onClick={refetchAttendees}
              >
                Retry
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <section className={styles.headerSection}>
          <Group justify="space-between" align="flex-start">
            <div>
              <h2 className={styles.pageTitle}>Attendees Management</h2>
              <div className={styles.badgeGroup}>
                <Badge className={styles.statsBadge} size="lg" variant="light" radius="sm">
                  {roleCounts.total || 0} Total
                </Badge>
                <Badge size="lg" variant="light" color="red" radius="sm">
                  {roleCounts.admins || roleCounts.ADMIN || 0} Admins
                </Badge>
                <Badge size="lg" variant="light" color="orange" radius="sm">
                  {roleCounts.organizers || roleCounts.ORGANIZER || 0} Organizers
                </Badge>
                <Badge size="lg" variant="light" color="blue" radius="sm">
                  {roleCounts.speakers || roleCounts.SPEAKER || 0} Speakers
                </Badge>
                <Badge size="lg" variant="light" color="gray" radius="sm">
                  {roleCounts.attendees || roleCounts.ATTENDEE || 0} Attendees
                </Badge>
              </div>
            </div>
            <Group>
              {/* CSV Import/Export - Commented out for post-launch implementation
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon className={styles.actionIcon} variant="subtle" size="lg">
                    <IconDots size={20} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown className={styles.menuDropdown}>
                  <Menu.Item
                    className={styles.menuItem}
                    leftSection={<IconDownload size={16} />}
                    onClick={handleExport}
                  >
                    Export to CSV
                  </Menu.Item>
                  <Menu.Item
                    className={styles.menuItem}
                    leftSection={<IconUpload size={16} />}
                    onClick={handleImport}
                  >
                    Import from CSV
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              */}
              <Button
                variant="primary"
                onClick={() => setInviteModalOpen(true)}
              >
                <IconPlus size={18} />
                Invite Attendees
              </Button>
            </Group>
          </Group>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          <Tabs value={activeTab} onChange={handleTabChange} className={styles.tabsContainer}>
            <Tabs.List className={styles.tabsList}>
              <Tabs.Tab 
                value="attendees" 
                className={styles.tab}
                leftSection={<IconUsers size={16} />}
              >
                Attendees ({roleCounts.total || 0})
              </Tabs.Tab>
              <Tabs.Tab 
                value="invitations" 
                className={styles.tab}
                leftSection={<IconMail size={16} />}
              >
                Pending Invitations ({invitationsData?.total_items || 0})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="attendees" className={styles.tabPanel}>
              <div className={styles.searchFilterContainer}>
                <TextInput
                  className={styles.searchInput}
                  placeholder="Search by name, email, or company..."
                  leftSection={<IconSearch size={16} />}
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  size="md"
                />
                <Select
                  className={styles.filterSelect}
                  placeholder="Filter by role"
                  leftSection={<IconFilter size={16} />}
                  value={filters.role}
                  onChange={handleRoleFilter}
                  size="md"
                  data={[
                    { value: 'ALL', label: 'All Roles' },
                    { value: 'ADMIN', label: 'Admins' },
                    { value: 'ORGANIZER', label: 'Organizers' },
                    { value: 'SPEAKER', label: 'Speakers' },
                    { value: 'ATTENDEE', label: 'Attendees' },
                  ]}
                />
              </div>

              <LoadingOverlay visible={isLoadingAttendees} />
              <AttendeesList
                attendees={sortedAttendees}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                adminCount={attendeesData?.role_counts?.admins || attendeesData?.event_users?.filter(u => u.role === 'ADMIN').length || 1}
                onUpdateRole={(user) => {
                  setRoleUpdateModal({ open: true, user });
                }}
                onSort={handleSort}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
              />
              {attendeesData?.total_pages > 1 && (
                <Group justify="center" mt="xl">
                  <Pagination
                    value={page}
                    onChange={setPage}
                    total={attendeesData.total_pages}
                  />
                </Group>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="invitations" className={styles.tabPanel}>
              <LoadingOverlay visible={isLoadingInvitations} />
              <PendingInvitations
                invitations={invitationsData?.invitations || []}
                onRefresh={refetchInvitations}
              />
              {invitationsData?.total_pages > 1 && (
                <Group justify="center" mt="xl">
                  <Pagination
                    value={invitationsPage}
                    onChange={setInvitationsPage}
                    total={invitationsData.total_pages}
                  />
                </Group>
              )}
            </Tabs.Panel>
          </Tabs>
        </section>

        <InviteModal
          opened={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          eventId={eventId}
          currentUserRole={currentUserRole}
          onSuccess={() => {
            refetchInvitations();
            setActiveTab('invitations');
          }}
        />

        <RoleUpdateModal
          opened={roleUpdateModal.open}
          onClose={() => setRoleUpdateModal({ open: false, user: null })}
          user={roleUpdateModal.user}
          eventId={eventId}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          adminCount={attendeesData?.role_counts?.admins || attendeesData?.event_users?.filter(u => u.role === 'ADMIN').length || 1}
          onSuccess={refetchAttendees}
        />
      </div>
    </div>
  );
};

export default AttendeesManager;