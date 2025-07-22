import { useState } from 'react';
import { Container, Title, TextInput, Group, Badge, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useGetConnectionsQuery } from '@/app/features/networking/api';
import { useSelector } from 'react-redux';
import { ConnectionsList } from './ConnectionsList';
import styles from './styles/index.module.css';

export default function NetworkPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const perPage = 50;
  const currentUser = useSelector((state) => state.auth.user);

  const { data, isLoading, error } = useGetConnectionsQuery({
    status: 'ACCEPTED',
    page,
    perPage,
  });

  // Filter connections based on search query
  const filteredConnections = data?.connections?.filter((connection) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    // Determine the other user based on current user ID
    const otherUser = connection.requester.id === currentUser?.id 
      ? connection.recipient 
      : connection.requester;
    
    return (
      otherUser.full_name?.toLowerCase().includes(query) ||
      otherUser.company_name?.toLowerCase().includes(query) ||
      otherUser.title?.toLowerCase().includes(query) ||
      connection.originating_event?.title?.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <Container size="xl" className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title order={2}>My Network</Title>
          <Text c="dimmed" size="sm">
            Manage your professional connections across all events
          </Text>
        </div>
        <Badge size="lg" variant="filled">
          {data?.total_items || 0} connections
        </Badge>
      </div>

      <Group className={styles.controls}>
        <TextInput
          placeholder="Search by name, company, title, or event..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </Group>

      <ConnectionsList
        connections={filteredConnections}
        isLoading={isLoading}
        error={error}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </Container>
  );
}