import { useState } from 'react';
import { Container, SimpleGrid, TextInput, Select, Group, Text, Loader, Center, Pagination, Stack } from '@mantine/core';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { useGetEventUsersQuery } from '@/app/features/events/api';
import { useCreateConnectionMutation } from '@/app/features/networking/api';
import { PersonCard } from '@/shared/components/PersonCard';
import { useNavigate } from 'react-router-dom';
import styles from './styles/index.module.css';

export function AttendeesGrid({ eventId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 50;
  
  // Fetch both ADMIN and ORGANIZER when "organizer" is selected
  const { data: adminData, isLoading: isLoadingAdmins } = useGetEventUsersQuery({
    eventId: eventId,
    role: 'ADMIN',
    page: page,
    per_page: perPage
  }, {
    skip: !eventId || filterRole !== 'organizer'
  });
  
  const { data: organizerData, isLoading: isLoadingOrganizers } = useGetEventUsersQuery({
    eventId: eventId,
    role: 'ORGANIZER',
    page: page,
    per_page: perPage
  }, {
    skip: !eventId || filterRole !== 'organizer'
  });
  
  const { data: regularData, isLoading: isLoadingRegular } = useGetEventUsersQuery({
    eventId: eventId,
    role: filterRole === 'all' ? undefined : filterRole === 'organizer' ? undefined : filterRole.toUpperCase(),
    page: page,
    per_page: perPage
  }, {
    skip: !eventId || filterRole === 'organizer'
  });
  
  // Determine which data to use based on filter
  const isLoading = filterRole === 'organizer' 
    ? (isLoadingAdmins || isLoadingOrganizers)
    : isLoadingRegular;
  
  const data = filterRole === 'organizer'
    ? {
        event_users: [...(adminData?.event_users || []), ...(organizerData?.event_users || [])],
        total_items: (adminData?.total_items || 0) + (organizerData?.total_items || 0)
      }
    : regularData;
  
  const attendees = data?.event_users || [];
  console.log('AttendeesGrid debug:', { eventId, data, attendees, isLoading });
  const [createConnection] = useCreateConnectionMutation();
  const navigate = useNavigate();

  const handleConnect = async (attendee) => {
    try {
      await createConnection({ 
        recipientId: attendee.user_id,
        icebreakerMessage: `Hi ${attendee.first_name}, I'd like to connect!`,
        originatingEventId: parseInt(eventId)
      }).unwrap();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleMessage = (attendee) => {
    // Navigate to DM or open chat
    navigate(`/app/events/${eventId}/messages/${attendee.user_id}`);
  };

  const filteredAttendees = attendees?.filter(attendee => {
    const matchesSearch = !searchQuery || 
      attendee.user_name?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
      attendee.speaker_title?.toLowerCase().includes(searchQuery?.toLowerCase() || '');
    
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
    <Container size="xl" py="xl">
      <Stack spacing="lg">
        {/* Header with filters */}
        <Group position="apart" className={styles.header}>
          <Group gap="md">
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
                { value: 'attendee', label: 'Attendees' }
              ]}
              className={styles.filterSelect}
            />
          </Group>
          <Text size="sm" c="dimmed">
            {data?.total_items || 0} total attendees
          </Text>
        </Group>

        {/* Attendees Grid */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {filteredAttendees?.map(attendee => (
            <PersonCard
              key={attendee.user_id}
              person={{
                id: attendee.user_id,
                firstName: attendee.first_name,
                lastName: attendee.last_name,
                title: attendee.speaker_title || '',
                company: '', // TODO: Add company_name to backend schema
                bio: attendee.speaker_bio || '',
                avatarUrl: attendee.image_url,
                linkedin: attendee.social_links?.linkedin,
                website: attendee.social_links?.website,
                email: '', // TODO: Add if needed based on privacy
                connectionStatus: null, // TODO: Implement connections
                privacySettings: {}
              }}
              variant={attendee.is_speaker ? 'speaker' : 'attendee'}
              role={attendee.role}
              onConnect={() => handleConnect(attendee)}
              onMessage={() => handleMessage(attendee)}
            />
          ))}
        </SimpleGrid>

        {filteredAttendees?.length === 0 && !isLoading && (
          <Center py="xl">
            <Text c="dimmed">No attendees found matching your criteria</Text>
          </Center>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Center>
            <Pagination 
              value={page} 
              onChange={setPage} 
              total={totalPages}
              size="md"
              withEdges
            />
          </Center>
        )}
      </Stack>
    </Container>
  );
}