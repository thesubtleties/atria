import React, { useState, useMemo } from 'react';
import {
  TextInput,
  Select,
  Center,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { LoadingSpinner } from '../../../shared/components/loading';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useGetEventUsersQuery,
  useGetEventQuery,
} from '@/app/features/events/api';
import {
  useCreateConnectionMutation,
  useCreateDirectMessageThreadMutation,
} from '@/app/features/networking/api';
import { PersonCard } from '@/shared/components/PersonCard';
import { IcebreakerModal } from '@/shared/components/IcebreakerModal';
import { useOpenThread } from '@/shared/hooks/useOpenThread';
import styles from './styles/index.module.css';

export function AttendeesGrid({ eventId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loadedAttendees, setLoadedAttendees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const perPage = 50;

  // Fetch event data for icebreakers
  const { data: eventData } = useGetEventQuery(eventId, { skip: !eventId });

  // Fetch both ADMIN and ORGANIZER when "organizer" is selected
  const { data: adminData, isLoading: isLoadingAdmins, isFetching: isFetchingAdmins } = useGetEventUsersQuery(
    {
      eventId: eventId,
      role: 'ADMIN',
      page: currentPage,
      per_page: perPage,
    },
    {
      skip: !eventId || filterRole !== 'organizer',
    }
  );

  const { data: organizerData, isLoading: isLoadingOrganizers, isFetching: isFetchingOrganizers } =
    useGetEventUsersQuery(
      {
        eventId: eventId,
        role: 'ORGANIZER',
        page: currentPage,
        per_page: perPage,
      },
      {
        skip: !eventId || filterRole !== 'organizer',
      }
    );

  const { data: regularData, isLoading: isLoadingRegular, isFetching: isFetchingRegular } =
    useGetEventUsersQuery(
      {
        eventId: eventId,
        role:
          filterRole === 'all'
            ? undefined
            : filterRole === 'organizer'
              ? undefined
              : filterRole?.toUpperCase(),
        page: currentPage,
        per_page: perPage,
      },
      {
        skip: !eventId || filterRole === 'organizer',
      }
    );

  // Determine which data to use based on filter
  const isInitialLoading =
    filterRole === 'organizer'
      ? isLoadingAdmins || isLoadingOrganizers
      : isLoadingRegular;
      
  const isFetchingMore =
    filterRole === 'organizer'
      ? isFetchingAdmins || isFetchingOrganizers
      : isFetchingRegular;

  const currentData = useMemo(() => {
    if (filterRole === 'organizer') {
      return {
        event_users: [
          ...(adminData?.event_users || []),
          ...(organizerData?.event_users || []),
        ],
        total_items:
          (adminData?.total_items || 0) +
          (organizerData?.total_items || 0),
        total_pages: Math.max(
          adminData?.total_pages || 0,
          organizerData?.total_pages || 0
        ),
        current_page: currentPage,
        has_next: (adminData?.has_next || false) || (organizerData?.has_next || false),
      };
    }
    return regularData;
  }, [filterRole, adminData, organizerData, regularData, currentPage]);

  // Update loaded attendees when new data arrives
  React.useEffect(() => {
    if (currentData?.event_users) {
      if (currentPage === 1) {
        // Reset for first page or filter change
        setLoadedAttendees(currentData.event_users);
      } else {
        // Append for subsequent pages
        setLoadedAttendees(prev => {
          // Create a map to avoid duplicates
          const existingIds = new Set(prev.map(a => a.user_id));
          const newAttendees = currentData.event_users.filter(
            a => !existingIds.has(a.user_id)
          );
          return [...prev, ...newAttendees];
        });
      }
      
      // Update hasMore based on API response
      setHasMore(currentData.has_next || false);
    }
  }, [currentData, currentPage]);
  console.log('AttendeesGrid debug:', { 
    eventId, 
    currentData, 
    loadedAttendees, 
    isInitialLoading,
    isFetchingMore,
    filterRole,
    currentPage,
    hasMore,
    totalItems: currentData?.total_items
  });
  const [createConnection, { isLoading: isCreatingConnection }] =
    useCreateConnectionMutation();
  const [createThread] = useCreateDirectMessageThreadMutation();
  const openThread = useOpenThread();

  const handleConnect = (attendee) => {
    setSelectedAttendee({
      id: attendee.user_id,
      firstName: attendee.first_name,
      lastName: attendee.last_name,
      title: attendee.title,
      company: attendee.company_name,
      avatarUrl: attendee.image_url,
    });
    setModalOpened(true);
  };

  const handleSendConnectionRequest = async (icebreakerMessage) => {
    if (!selectedAttendee) return;

    try {
      await createConnection({
        recipientId: selectedAttendee.id,
        icebreakerMessage,
        originatingEventId: parseInt(eventId),
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

  const handleMessage = async (attendee) => {
    try {
      // Create or get thread with this user
      const result = await createThread(attendee.user_id).unwrap();

      // Open the thread using unified hook (works for both desktop and mobile)
      openThread(result.thread_id || result.id);

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
      <Center className={styles.loader}>
        <LoadingSpinner size="lg" />
      </Center>
    );
  }

  // Reset when filters change
  const handleFilterChange = (value) => {
    // Default to 'all' if value is cleared/null
    const newRole = value || 'all';
    setFilterRole(newRole);
    setCurrentPage(1);
    setLoadedAttendees([]);
    setHasMore(true);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header with filters */}
      <div className={styles.header}>
        <div className={styles.filterGroup}>
          <TextInput
            placeholder="Search attendees..."
            leftSection={<IconSearch size={18} />}
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
          <Select
            placeholder="Filter by role"
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
            className={styles.filterSelect}
          />
        </div>
        <div className={styles.countDisplay}>
          {searchQuery ? (
            <>
              <span className={styles.countNumber}>{filteredAttendees?.length || 0}</span>
              <span className={styles.countLabel}>matching</span>
              <span className={styles.countDivider}>•</span>
              <span className={styles.countNumber}>{loadedAttendees?.length || 0}</span>
              <span className={styles.countLabel}>loaded</span>
              <span className={styles.countDivider}>•</span>
              <span className={styles.countNumber}>{currentData?.total_items || 0}</span>
              <span className={styles.countLabel}>total</span>
            </>
          ) : (
            <>
              <span className={styles.countNumber}>{loadedAttendees?.length || 0}</span>
              <span className={styles.countLabel}>of</span>
              <span className={styles.countNumber}>{currentData?.total_items || 0}</span>
              <span className={styles.countLabel}>attendees</span>
            </>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div className={styles.gridContainer}>
        <div className={styles.attendeeGrid}>
          {filteredAttendees?.map((attendee) => (
            <PersonCard
              key={attendee.user_id}
              person={{
                id: attendee.user_id,
                firstName: attendee.first_name,
                lastName: attendee.last_name,
                title: attendee.title || '',
                company: attendee.company_name,
                bio: '', // TODO: Add bio
                avatarUrl: attendee.image_url,
                linkedin: attendee.social_links?.linkedin,
                twitter: attendee.social_links?.twitter,
                website: attendee.social_links?.website,
                email: attendee.email || '', // Now provided by backend with privacy filtering
                connectionStatus: attendee.connection_status || null,
                privacySettings: {},
              }}
              variant={attendee.is_speaker ? 'speaker' : 'attendee'}
              role={attendee.role}
              onConnect={() => handleConnect(attendee)}
              onMessage={() => handleMessage(attendee)}
            />
          ))}
        </div>

        {filteredAttendees?.length === 0 && !isInitialLoading && (
          <div className={styles.emptyState}>
            <Text c="dimmed">No attendees found matching your criteria</Text>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className={styles.paginationContainer}>
          <button
            onClick={handleLoadMore}
            disabled={isFetchingMore}
            className={styles.loadMoreButton}
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
            {isFetchingMore ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LoadingSpinner size="xs" />
                Loading more...
              </span>
            ) : (
              'Load More Attendees'
            )}
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
        eventIcebreakers={eventData?.icebreakers || []}
        onSend={handleSendConnectionRequest}
        isLoading={isCreatingConnection}
      />
    </div>
  );
}
