import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mantine/hooks';
import { Group, TextInput, Select, Tabs, Text, Pagination } from '@mantine/core';
import { LoadingOverlay } from '@/shared/components/loading';
import { IconSearch, IconFilter, IconUsers, IconMail, IconChevronDown } from '@tabler/icons-react';
import { useGetEventInvitationsQuery } from '@/app/features/eventInvitations/api';
import { useGetEventQuery, useGetEventUsersAdminQuery } from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import { getNameSortValue } from '@/shared/utils/sorting';
import { cn } from '@/lib/cn';
import type { RootState } from '@/app/store';
import type { EventUser, Event } from '@/types';
import type { EventUserRole } from '@/types/enums';
import type { EventUserRoleType } from './schemas/attendeeSchemas';
import HeaderSection from './HeaderSection';
import AttendeesList from './AttendeesList';
import PendingInvitations from './PendingInvitations';
import InviteModal from './InviteModal';
import RoleUpdateModal from './RoleUpdateModal';
import styles from './styles/index.module.css';

type RoleCounts = {
  total: number;
  admins?: number;
  organizers?: number;
  speakers?: number;
  attendees?: number;
  ADMIN?: number;
  ORGANIZER?: number;
  SPEAKER?: number;
  ATTENDEE?: number;
};

type FilterState = {
  search: string;
  role: 'ALL' | EventUserRole;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

type RoleUpdateModalState = {
  open: boolean;
  user: EventUser | null;
};

const AttendeesManager = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const parsedEventId = eventId ? parseInt(eventId, 10) : undefined;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [viewMode, setViewMode] = useState<'attendees' | 'invitations'>('attendees');

  const handleViewChange = (value: string | null) => {
    if (value === 'attendees' || value === 'invitations') {
      setViewMode(value);
      // Reset pagination when switching views
      if (value === 'invitations') {
        setInvitationsPage(1);
      } else {
        setPage(1);
      }
    }
  };

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [roleUpdateModal, setRoleUpdateModal] = useState<RoleUpdateModalState>({
    open: false,
    user: null,
  });
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: 'ALL',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Get current user info
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id;

  // Fetch event details to get current user's role
  const { data: eventData } = useGetEventQuery({ id: parsedEventId! }, { skip: !parsedEventId });
  const typedEventData = eventData as Event | undefined;
  const currentUserRole: EventUserRoleType =
    (typedEventData?.user_role as EventUserRoleType) || 'ATTENDEE';

  // Fetch attendees with pagination (using admin endpoint for email/full name access)
  const [page, setPage] = useState(1);
  const queryParams =
    parsedEventId ?
      {
        eventId: parsedEventId,
        page,
        per_page: 50,
        ...(filters.role !== 'ALL' && { role: filters.role as EventUserRole }),
      }
    : undefined;

  const {
    data: attendeesData,
    isLoading: isLoadingAttendees,
    error: attendeesError,
    refetch: refetchAttendees,
  } = useGetEventUsersAdminQuery(queryParams!, { skip: !parsedEventId });

  // Fetch pending invitations with pagination
  const [invitationsPage, setInvitationsPage] = useState(1);
  const {
    data: invitationsData,
    isLoading: isLoadingInvitations,
    refetch: refetchInvitations,
  } = useGetEventInvitationsQuery(
    {
      eventId: parsedEventId!,
      page: invitationsPage,
      perPage: 50,
    },
    { skip: !parsedEventId },
  );

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleRoleFilter = (value: string | null) => {
    // Ensure we always have a role value - default to 'ALL' if cleared
    const roleValue = (value || 'ALL') as 'ALL' | EventUserRole;
    setFilters((prev) => ({ ...prev, role: roleValue }));
    setPage(1);
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Type the event_users response properly
  type AdminEventUser = EventUser & {
    organization_id?: number;
  };

  const eventUsers = (attendeesData as { event_users?: AdminEventUser[] } | undefined)?.event_users;

  const filteredAttendees =
    eventUsers?.filter((user) => {
      if (!filters.search) return true;
      const searchLower = filters.search.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.company_name?.toLowerCase().includes(searchLower)
      );
    }) || [];

  const sortedAttendees = [...filteredAttendees].sort((a, b) => {
    let aVal: string;
    let bVal: string;
    switch (filters.sortBy) {
      case 'name':
        // Use the new sorting utility for proper last name sorting
        aVal = getNameSortValue(a);
        bVal = getNameSortValue(b);
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
        // Default to name sorting with last name first
        aVal = getNameSortValue(a);
        bVal = getNameSortValue(b);
    }

    // Use localeCompare for better string comparison, especially for names
    const comparison = aVal.localeCompare(bVal);
    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  // Use role counts from backend if available, otherwise calculate from current page
  const roleCounts: RoleCounts = (attendeesData as { role_counts?: RoleCounts } | undefined)
    ?.role_counts ||
    eventUsers?.reduce<RoleCounts>(
      (acc, user) => {
        const role = user.role as keyof Pick<
          RoleCounts,
          'ADMIN' | 'ORGANIZER' | 'SPEAKER' | 'ATTENDEE'
        >;
        acc[role] = (acc[role] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      },
      { total: 0 },
    ) || { total: 0 };

  const errorMessage =
    attendeesError && typeof attendeesError === 'object' && 'message' in attendeesError ?
      (attendeesError as { message: string }).message
    : 'Unknown error';

  if (attendeesError) {
    return (
      <div className={cn(styles.container)}>
        <div className={cn(styles.bgShape1)} />
        <div className={cn(styles.bgShape2)} />

        <div className={cn(styles.contentWrapper)}>
          <section className={cn(styles.mainContent)}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Text c='red' size='lg' mb='md'>
                Error loading attendees: {errorMessage}
              </Text>
              <Button variant='primary' onClick={refetchAttendees}>
                Retry
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.container)}>
      {/* Background Shapes */}
      <div className={cn(styles.bgShape1)} />
      <div className={cn(styles.bgShape2)} />

      <div className={cn(styles.contentWrapper)}>
        {/* Header Section */}
        <HeaderSection roleCounts={roleCounts} onInviteClick={() => setInviteModalOpen(true)} />

        {/* Main Content Section */}
        <section className={cn(styles.mainContent)}>
          {/* Mobile View Selector - Only visible on mobile */}
          <div className={cn(styles.mobileViewSelector)}>
            <Select
              value={viewMode}
              onChange={handleViewChange}
              data={[
                {
                  value: 'attendees',
                  label: `Attendees (${roleCounts.total || 0})`,
                },
                {
                  value: 'invitations',
                  label: `Pending Invitations (${invitationsData?.total_items || 0})`,
                },
              ]}
              leftSection={
                viewMode === 'attendees' ? <IconUsers size={16} /> : <IconMail size={16} />
              }
              rightSection={<IconChevronDown size={16} />}
              className={cn(styles.mobileSelect)}
              classNames={{
                input: styles.mobileSelectInput ?? '',
                dropdown: styles.mobileSelectDropdown ?? '',
              }}
              searchable={false}
              allowDeselect={false}
            />
          </div>

          {/* Desktop Tabs - Hidden on mobile */}
          {!isMobile && (
            <Tabs value={viewMode} onChange={handleViewChange} className={cn(styles.tabsContainer)}>
              <Tabs.List className={cn(styles.tabsList)}>
                <Tabs.Tab
                  value='attendees'
                  className={cn(styles.tab)}
                  leftSection={<IconUsers size={16} />}
                >
                  Attendees ({roleCounts.total || 0})
                </Tabs.Tab>
                <Tabs.Tab
                  value='invitations'
                  className={cn(styles.tab)}
                  leftSection={<IconMail size={16} />}
                >
                  Pending Invitations ({invitationsData?.total_items || 0})
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          )}

          {/* Content based on viewMode */}
          {viewMode === 'attendees' ?
            <div className={cn(styles.tabPanel)}>
              <div className={cn(styles.searchFilterContainer)}>
                <TextInput
                  className={cn(styles.searchInput)}
                  placeholder='Search by name, email, or company...'
                  leftSection={<IconSearch size={16} />}
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  size='md'
                />
                <Select
                  className={cn(styles.filterSelect)}
                  placeholder='Filter by role'
                  leftSection={<IconFilter size={16} />}
                  value={filters.role}
                  onChange={handleRoleFilter}
                  size='md'
                  clearable={false}
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
                adminCount={
                  (attendeesData as { role_counts?: RoleCounts } | undefined)?.role_counts
                    ?.admins ||
                  eventUsers?.filter((u) => u.role === 'ADMIN').length ||
                  1
                }
                eventIcebreakers={typedEventData?.icebreakers || []}
                onUpdateRole={(user: EventUser) => {
                  setRoleUpdateModal({ open: true, user });
                }}
                onSort={handleSort}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
              />
              {attendeesData && attendeesData.total_pages > 1 && (
                <Group justify='center' mt='xl'>
                  <Pagination
                    value={page}
                    onChange={setPage}
                    total={attendeesData.total_pages}
                    className={cn(styles.pagination)}
                  />
                </Group>
              )}
            </div>
          : <div className={cn(styles.tabPanel)}>
              <LoadingOverlay visible={isLoadingInvitations} />
              <PendingInvitations
                invitations={invitationsData?.invitations || []}
                onRefresh={refetchInvitations}
              />
              {invitationsData && invitationsData.total_pages > 1 && (
                <Group justify='center' mt='xl'>
                  <Pagination
                    value={invitationsPage}
                    onChange={setInvitationsPage}
                    total={invitationsData.total_pages}
                    className={cn(styles.pagination)}
                  />
                </Group>
              )}
            </div>
          }
        </section>

        <InviteModal
          opened={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          eventId={parsedEventId}
          currentUserRole={currentUserRole}
          onSuccess={() => {
            refetchInvitations();
            setViewMode('invitations');
          }}
        />

        <RoleUpdateModal
          opened={roleUpdateModal.open}
          onClose={() => setRoleUpdateModal({ open: false, user: null })}
          user={roleUpdateModal.user}
          eventId={parsedEventId}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          adminCount={
            (attendeesData as { role_counts?: RoleCounts } | undefined)?.role_counts?.admins ||
            eventUsers?.filter((u) => u.role === 'ADMIN').length ||
            1
          }
          onSuccess={refetchAttendees}
        />
      </div>
    </div>
  );
};

export default AttendeesManager;
