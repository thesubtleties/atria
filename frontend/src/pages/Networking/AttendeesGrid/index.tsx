import { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { TextInput, Select, Center, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { LoadingSpinner } from '@/shared/components/loading';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useGetEventUsersQuery, useGetEventQuery } from '@/app/features/events/api';
import {
  useCreateConnectionMutation,
  useCreateDirectMessageThreadMutation,
} from '@/app/features/networking/api';
import { PersonCard } from '@/shared/components/PersonCard';
import { IcebreakerModal } from '@/shared/components/IcebreakerModal';
import { useOpenThread } from '@/shared/hooks/useOpenThread';
import { cn } from '@/lib/cn';
import type { EventUserRole } from '@/types';
import styles from './styles/index.module.css';

type AttendeesGridProps = {
  eventId?: string;
};

type Attendee = {
  user_id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  title?: string;
  speaker_title?: string;
  company_name?: string;
  image_url?: string;
  email?: string;
  role?: EventUserRole;
  connection_status?: string;
  can_send_connection_request?: boolean;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
};

type SelectedAttendee = {
  id: number;
  firstName: string;
  lastName: string;
  title?: string | undefined;
  company?: string | undefined;
  avatarUrl?: string | null | undefined;
};

type EventUsersResponse = {
  event_users?: Attendee[];
  total_items?: number;
  total_pages?: number;
  current_page?: number;
  has_next?: boolean;
};

type EventResponse = {
  icebreakers?: string[];
};

type ThreadResponse = {
  thread_id?: number;
  id?: number;
};

export function AttendeesGrid({ eventId }: AttendeesGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>('all');
  const [loadedAttendees, setLoadedAttendees] = useState<Attendee[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<SelectedAttendee | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const perPage = 50;

  // Fetch event data for icebreakers
  const { data: eventData } = useGetEventQuery({ id: Number(eventId) }, { skip: !eventId });
  const typedEventData = eventData as EventResponse | undefined;

  // Fetch both ADMIN and ORGANIZER when "organizer" is selected
  const {
    data: adminData,
    isLoading: isLoadingAdmins,
    isFetching: isFetchingAdmins,
  } = useGetEventUsersQuery(
    {
      eventId: Number(eventId),
      role: 'ADMIN',
      page: currentPage,
      per_page: perPage,
    },
    {
      skip: !eventId || filterRole !== 'organizer',
    },
  );

  const {
    data: organizerData,
    isLoading: isLoadingOrganizers,
    isFetching: isFetchingOrganizers,
  } = useGetEventUsersQuery(
    {
      eventId: Number(eventId),
      role: 'ORGANIZER',
      page: currentPage,
      per_page: perPage,
    },
    {
      skip: !eventId || filterRole !== 'organizer',
    },
  );

  // Compute role for query
  const computedRole =
    filterRole === 'all' ? undefined
    : filterRole === 'organizer' ? undefined
    : (filterRole?.toUpperCase() as EventUserRole | undefined);

  const {
    data: regularData,
    isLoading: isLoadingRegular,
    isFetching: isFetchingRegular,
  } = useGetEventUsersQuery(
    computedRole ?
      {
        eventId: Number(eventId),
        role: computedRole,
        page: currentPage,
        per_page: perPage,
      }
    : {
        eventId: Number(eventId),
        page: currentPage,
        per_page: perPage,
      },
    {
      skip: !eventId || filterRole === 'organizer',
    },
  );

  const typedAdminData = adminData as EventUsersResponse | undefined;
  const typedOrganizerData = organizerData as EventUsersResponse | undefined;
  const typedRegularData = regularData as EventUsersResponse | undefined;

  // Determine which data to use based on filter
  const isInitialLoading =
    filterRole === 'organizer' ? isLoadingAdmins || isLoadingOrganizers : isLoadingRegular;

  const isFetchingMore =
    filterRole === 'organizer' ? isFetchingAdmins || isFetchingOrganizers : isFetchingRegular;

  const currentData = useMemo((): EventUsersResponse | undefined => {
    if (filterRole === 'organizer') {
      return {
        event_users: [
          ...(typedAdminData?.event_users || []),
          ...(typedOrganizerData?.event_users || []),
        ],
        total_items: (typedAdminData?.total_items || 0) + (typedOrganizerData?.total_items || 0),
        total_pages: Math.max(
          typedAdminData?.total_pages || 0,
          typedOrganizerData?.total_pages || 0,
        ),
        current_page: currentPage,
        has_next: typedAdminData?.has_next || false || typedOrganizerData?.has_next || false,
      };
    }
    return typedRegularData;
  }, [filterRole, typedAdminData, typedOrganizerData, typedRegularData, currentPage]);

  // Update loaded attendees when new data arrives
  useEffect(() => {
    if (currentData?.event_users) {
      if (currentPage === 1) {
        // Reset for first page or filter change
        setLoadedAttendees(currentData.event_users);
      } else {
        // Append for subsequent pages
        setLoadedAttendees((prev) => {
          // Create a map to avoid duplicates
          const existingIds = new Set(prev.map((a) => a.user_id));
          const newAttendees =
            currentData.event_users?.filter((a) => !existingIds.has(a.user_id)) || [];
          return [...prev, ...newAttendees];
        });
      }

      // Update hasMore based on API response
      setHasMore(currentData.has_next || false);
    }
  }, [currentData, currentPage]);

  const [createConnection, { isLoading: isCreatingConnection }] = useCreateConnectionMutation();
  const [createThread] = useCreateDirectMessageThreadMutation();
  const openThread = useOpenThread();

  const handleConnect = (attendee: Attendee) => {
    setSelectedAttendee({
      id: attendee.user_id,
      firstName: attendee.first_name,
      lastName: attendee.last_name,
      title: attendee.title,
      company: attendee.company_name,
      avatarUrl: attendee.image_url ?? null,
    });
    setModalOpened(true);
  };

  const handleSendConnectionRequest = async (icebreakerMessage: string) => {
    if (!selectedAttendee) return;

    try {
      await createConnection({
        recipient_id: selectedAttendee.id,
        icebreaker_message: icebreakerMessage,
        originating_event_id: parseInt(eventId as string),
      }).unwrap();

      notifications.show({
        title: 'Connection request sent',
        message: `Your request has been sent to ${selectedAttendee.firstName}`,
        color: 'green',
      });

      setModalOpened(false);
      setSelectedAttendee(null);
    } catch (error) {
      console.error('Failed to connect:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send connection request. Please try again.',
        color: 'red',
      });
    }
  };

  const handleMessage = async (attendee: Attendee) => {
    try {
      // Create or get thread with this user
      const result = (await createThread(attendee.user_id).unwrap()) as ThreadResponse;

      // Open the thread using unified hook (works for both desktop and mobile)
      const threadId = result.thread_id || result.id;
      if (threadId !== undefined) {
        openThread(threadId);
      }

      // Only show notification on desktop - mobile makes it obvious with full screen
      if (!isMobile) {
        notifications.show({
          title: 'Message opened',
          message: `Chat with ${attendee.first_name} is ready`,
          color: 'blue',
        });
      }
    } catch (error) {
      console.error('Failed to create/get thread:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to open message thread. Please try again.',
        color: 'red',
      });
    }
  };

  const filteredAttendees = loadedAttendees?.filter((attendee) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      attendee.first_name?.toLowerCase().includes(searchLower) ||
      attendee.last_name?.toLowerCase().includes(searchLower) ||
      attendee.full_name?.toLowerCase().includes(searchLower) ||
      attendee.company_name?.toLowerCase().includes(searchLower) ||
      attendee.title?.toLowerCase().includes(searchLower) ||
      attendee.speaker_title?.toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  if (isInitialLoading && currentPage === 1) {
    return (
      <Center className={cn(styles.loader)}>
        <LoadingSpinner size='lg' />
      </Center>
    );
  }

  // Reset when filters change
  const handleFilterChange = (value: string | null) => {
    // Default to 'all' if value is cleared/null
    const newRole = value || 'all';
    setFilterRole(newRole);
    setCurrentPage(1);
    setLoadedAttendees([]);
    setHasMore(true);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className={cn(styles.container)}>
      {/* Header with filters */}
      <div className={cn(styles.header)}>
        <div className={cn(styles.filterGroup)}>
          <TextInput
            placeholder='Search attendees...'
            leftSection={<IconSearch size={18} />}
            value={searchQuery}
            onChange={handleSearchChange}
            className={cn(styles.searchInput)}
          />
          <Select
            placeholder='Filter by role'
            leftSection={<IconFilter size={18} />}
            value={filterRole}
            onChange={handleFilterChange}
            clearable={false}
            data={[
              { value: 'all', label: 'All Attendees' },
              { value: 'speaker', label: 'Speakers' },
              { value: 'organizer', label: 'Organizers' },
              { value: 'attendee', label: 'Attendees' },
            ]}
            className={cn(styles.filterSelect)}
          />
        </div>
        <div className={cn(styles.countDisplay)}>
          {searchQuery ?
            <>
              <span className={cn(styles.countNumber)}>{filteredAttendees?.length || 0}</span>
              <span className={cn(styles.countLabel)}>matching</span>
              <span className={cn(styles.countDivider)}>•</span>
              <span className={cn(styles.countNumber)}>{loadedAttendees?.length || 0}</span>
              <span className={cn(styles.countLabel)}>loaded</span>
              <span className={cn(styles.countDivider)}>•</span>
              <span className={cn(styles.countNumber)}>{currentData?.total_items || 0}</span>
              <span className={cn(styles.countLabel)}>total</span>
            </>
          : <>
              <span className={cn(styles.countNumber)}>{loadedAttendees?.length || 0}</span>
              <span className={cn(styles.countLabel)}>of</span>
              <span className={cn(styles.countNumber)}>{currentData?.total_items || 0}</span>
              <span className={cn(styles.countLabel)}>attendees</span>
            </>
          }
        </div>
      </div>

      {/* Grid Container */}
      <div className={cn(styles.gridContainer)}>
        <div className={cn(styles.attendeeGrid)}>
          {filteredAttendees?.map((attendee) => (
            <PersonCard
              key={attendee.user_id}
              person={{
                id: attendee.user_id,
                firstName: attendee.first_name,
                lastName: attendee.last_name,
                title: attendee.title || '',
                company: attendee.company_name,
                bio: '',
                avatarUrl: attendee.image_url,
                linkedin: attendee.social_links?.linkedin,
                twitter: attendee.social_links?.twitter,
                website: attendee.social_links?.website,
                email: attendee.email || '',
                connectionStatus: attendee.connection_status,
                canSendConnectionRequest: attendee.can_send_connection_request,
                privacySettings: {},
              }}
              role={attendee.role}
              onConnect={() => handleConnect(attendee)}
              onMessage={() => handleMessage(attendee)}
            />
          ))}
        </div>

        {filteredAttendees?.length === 0 && !isInitialLoading && (
          <div className={cn(styles.emptyState)}>
            <Text c='dimmed'>No attendees found matching your criteria</Text>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className={cn(styles.paginationContainer)}>
          <button
            onClick={handleLoadMore}
            disabled={isFetchingMore}
            className={cn(styles.loadMoreButton)}
            style={{
              padding: '0.75rem 2rem',
              background: isFetchingMore ? '#f3f4f6' : '#8b5cf6',
              color: isFetchingMore ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: isFetchingMore ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isFetchingMore ?
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LoadingSpinner size='xs' />
                Loading more...
              </span>
            : 'Load More Attendees'}
          </button>
        </div>
      )}

      {/* Icebreaker Modal */}
      <IcebreakerModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSelectedAttendee(null);
        }}
        recipient={selectedAttendee}
        eventIcebreakers={typedEventData?.icebreakers || []}
        onSend={handleSendConnectionRequest}
        isLoading={isCreatingConnection}
      />
    </div>
  );
}
