import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Group,
  Title,
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
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useGetEventInvitationsQuery,
} from '../../../app/features/eventInvitations/api';
import { 
  useGetEventQuery,
  useGetEventUsersAdminQuery,
} from '../../../app/features/events/api';
import AttendeesList from './AttendeesList';
import PendingInvitations from './PendingInvitations';
import InviteModal from './InviteModal';
import RoleUpdateModal from './RoleUpdateModal';
import { attendeeFilterSchema } from './schemas/attendeeSchemas';
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

  // Count attendees by role
  const roleCounts = attendeesData?.event_users?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {}) || { total: 0 };

  if (attendeesError) {
    return (
      <Box className={styles.container}>
        <Text color="red" align="center">
          Error loading attendees: {attendeesError.message}
        </Text>
        <Button onClick={refetchAttendees} mt="md">
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Attendees Management</Title>
          <Group mt="xs" gap="xs">
            <Badge size="lg" variant="light" radius="sm">
              {roleCounts.total || 0} Total
            </Badge>
            <Badge size="lg" variant="light" color="red" radius="sm">
              {roleCounts.ADMIN || 0} Admins
            </Badge>
            <Badge size="lg" variant="light" color="orange" radius="sm">
              {roleCounts.ORGANIZER || 0} Organizers
            </Badge>
            <Badge size="lg" variant="light" color="blue" radius="sm">
              {roleCounts.SPEAKER || 0} Speakers
            </Badge>
            <Badge size="lg" variant="light" color="gray" radius="sm">
              {roleCounts.ATTENDEE || 0} Attendees
            </Badge>
          </Group>
        </div>
        <Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg">
                <IconDots size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconDownload size={16} />}
                onClick={handleExport}
              >
                Export to CSV
              </Menu.Item>
              <Menu.Item
                leftSection={<IconUpload size={16} />}
                onClick={handleImport}
              >
                Import from CSV
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => setInviteModalOpen(true)}
          >
            Invite Attendees
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tabs.List mb="xl">
          <Tabs.Tab value="attendees">
            Attendees ({roleCounts.total || 0})
          </Tabs.Tab>
          <Tabs.Tab value="invitations">
            Pending Invitations ({invitationsData?.total_items || 0})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="attendees">
          <Group mb="md" grow>
            <TextInput
              placeholder="Search by name, email, or company..."
              leftSection={<IconSearch size={16} />}
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Select
              placeholder="Filter by role"
              leftSection={<IconFilter size={16} />}
              value={filters.role}
              onChange={handleRoleFilter}
              data={[
                { value: 'ALL', label: 'All Roles' },
                { value: 'ADMIN', label: 'Admins' },
                { value: 'ORGANIZER', label: 'Organizers' },
                { value: 'SPEAKER', label: 'Speakers' },
                { value: 'ATTENDEE', label: 'Attendees' },
              ]}
            />
          </Group>

          <LoadingOverlay visible={isLoadingAttendees} />
          <AttendeesList
            attendees={sortedAttendees}
            currentUserRole={currentUserRole}
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

        <Tabs.Panel value="invitations">
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

      <InviteModal
        opened={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        eventId={eventId}
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
        onSuccess={refetchAttendees}
      />
    </Box>
  );
};

export default AttendeesManager;