import { useState } from 'react';
import {
  TextInput,
  Select,
  Text,
  Loader,
  Center,
  Pagination,
} from '@mantine/core';
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
import { useDispatch } from 'react-redux';
import { openThread } from '@/app/store/chatSlice';
import styles from './styles/index.module.css';

export function AttendeesGrid({ eventId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const perPage = 50;

  // Fetch event data for icebreakers
  const { data: eventData } = useGetEventQuery(eventId, { skip: !eventId });

  // Fetch both ADMIN and ORGANIZER when "organizer" is selected
  const { data: adminData, isLoading: isLoadingAdmins } = useGetEventUsersQuery(
    {
      eventId: eventId,
      role: 'ADMIN',
      page: page,
      per_page: perPage,
    },
    {
      skip: !eventId || filterRole !== 'organizer',
    }
  );

  const { data: organizerData, isLoading: isLoadingOrganizers } =
    useGetEventUsersQuery(
      {
        eventId: eventId,
        role: 'ORGANIZER',
        page: page,
        per_page: perPage,
      },
      {
        skip: !eventId || filterRole !== 'organizer',
      }
    );

  const { data: regularData, isLoading: isLoadingRegular } =
    useGetEventUsersQuery(
      {
        eventId: eventId,
        role:
          filterRole === 'all'
            ? undefined
            : filterRole === 'organizer'
              ? undefined
              : filterRole?.toUpperCase(),
        page: page,
        per_page: perPage,
      },
      {
        skip: !eventId || filterRole === 'organizer',
      }
    );

  // Determine which data to use based on filter
  const isLoading =
    filterRole === 'organizer'
      ? isLoadingAdmins || isLoadingOrganizers
      : isLoadingRegular;

  const data =
    filterRole === 'organizer'
      ? {
          event_users: [
            ...(adminData?.event_users || []),
            ...(organizerData?.event_users || []),
          ],
          total_items:
            (adminData?.total_items || 0) + (organizerData?.total_items || 0),
        }
      : regularData;

  const attendees = data?.event_users || [];
  console.log('AttendeesGrid debug:', { eventId, data, attendees, isLoading });
  console.log('Event data:', eventData);
  console.log('Event icebreakers:', eventData?.icebreakers);

  // Debug connection statuses
  if (attendees.length > 0) {
    console.log('Connection statuses for all attendees:');
    attendees.forEach((a) => {
      console.log(`${a.first_name} ${a.last_name} (ID: ${a.user_id}):`, {
        connection_status: a.connection_status,
        connection_id: a.connection_id,
        connection_direction: a.connection_direction,
      });
    });
  }
  const [createConnection, { isLoading: isCreatingConnection }] =
    useCreateConnectionMutation();
  const [createThread] = useCreateDirectMessageThreadMutation();
  const dispatch = useDispatch();

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

      // Open the thread in the chat sidebar
      dispatch(openThread(result.thread_id || result.id));

      // Optionally navigate to a dedicated messaging page
      // For now, just open the sidebar which should show the conversation
      notifications.show({
        title: 'Message opened',
        message: `Chat with ${attendee.first_name} is ready`,
        color: 'blue',
      });
    } catch (error) {
      console.error('Failed to create/get thread:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to open message thread. Please try again.',
        color: 'red',
      });
    }
  };

  const filteredAttendees = attendees?.filter((attendee) => {
    const matchesSearch =
      !searchQuery ||
      attendee.user_name
        ?.toLowerCase()
        .includes(searchQuery?.toLowerCase() || '') ||
      attendee.speaker_title
        ?.toLowerCase()
        .includes(searchQuery?.toLowerCase() || '');

    // Role filtering is now handled by the API query
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <Center className={styles.loader}>
        <Loader size="lg" />
      </Center>
    );
  }

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.total_items / perPage) : 1;

  // Reset page when filters change
  const handleFilterChange = (value) => {
    setFilterRole(value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
            data={[
              { value: 'all', label: 'All Attendees' },
              { value: 'speaker', label: 'Speakers' },
              { value: 'organizer', label: 'Organizers' },
              { value: 'attendee', label: 'Attendees' },
            ]}
            className={styles.filterSelect}
          />
        </div>
        <Text className={styles.totalCount}>
          {data?.total_items || 0} total attendees
        </Text>
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
                website: attendee.social_links?.website,
                email: '', // TODO: Add if needed based on privacy
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

        {filteredAttendees?.length === 0 && !isLoading && (
          <div className={styles.emptyState}>
            <Text c="dimmed">No attendees found matching your criteria</Text>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <Pagination
            value={page}
            onChange={setPage}
            total={totalPages}
            size="md"
            withEdges
          />
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
