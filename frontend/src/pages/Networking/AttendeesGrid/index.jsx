import { useState } from 'react';
import { Grid, TextInput, Select, Group, Text, Loader, Center } from '@mantine/core';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { useGetEventAttendeesQuery, useConnectAttendeeMutation } from '@/app/features/attendees/api';
import { PersonCard } from '@/shared/components/PersonCard';
import { useNavigate } from 'react-router-dom';
import styles from './styles/index.module.css';

export function AttendeesGrid({ eventId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const { data: attendees, isLoading } = useGetEventAttendeesQuery(eventId);
  const [connectAttendee] = useConnectAttendeeMutation();
  const navigate = useNavigate();

  const handleConnect = async (attendee) => {
    try {
      await connectAttendee({ 
        eventId, 
        attendeeId: attendee.id,
        message: `Hi ${attendee.firstName}, I'd like to connect!` 
      }).unwrap();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleMessage = (attendee) => {
    // Navigate to DM or open chat
    navigate(`/app/events/${eventId}/messages/${attendee.id}`);
  };

  const filteredAttendees = attendees?.filter(attendee => {
    const matchesSearch = !searchQuery || 
      `${attendee.firstName} ${attendee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || attendee.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <Center className={styles.loader}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Group gap="md" className={styles.filters}>
          <TextInput
            placeholder="Search attendees..."
            leftSection={<IconSearch size={18} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <Select
            placeholder="Filter by role"
            leftSection={<IconFilter size={18} />}
            value={filterRole}
            onChange={setFilterRole}
            data={[
              { value: 'all', label: 'All Attendees' },
              { value: 'speaker', label: 'Speakers' },
              { value: 'organizer', label: 'Organizers' },
              { value: 'attendee', label: 'Attendees' }
            ]}
            className={styles.filterSelect}
          />
        </Group>
        <Text size="sm" color="dimmed">
          {filteredAttendees?.length || 0} attendees
        </Text>
      </div>

      <div className={styles.gridWrapper}>
        <Grid gutter="md">
          {filteredAttendees?.map(attendee => (
            <Grid.Col key={attendee.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <PersonCard
                person={attendee}
                variant={attendee.role === 'speaker' ? 'speaker' : 'attendee'}
                onConnect={handleConnect}
                onMessage={handleMessage}
              />
            </Grid.Col>
          ))}
        </Grid>

        {filteredAttendees?.length === 0 && (
          <Center className={styles.empty}>
            <Text color="dimmed">No attendees found matching your criteria</Text>
          </Center>
        )}
      </div>
    </div>
  );
}