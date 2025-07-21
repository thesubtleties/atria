import { useState } from 'react';
import {
  Container,
  Stack,
  Title,
  Text,
  Loader,
  Center,
  Pagination,
  SimpleGrid,
  Alert,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useGetPendingConnectionsQuery } from '@/app/features/networking/api';
import { RequestCard } from './RequestCard';
import styles from './styles/index.module.css';

export function RequestsList({ eventId }) {
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading, error } = useGetPendingConnectionsQuery({
    page,
    perPage,
  });

  if (isLoading) {
    return (
      <Center className={styles.loader}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconInfoCircle size={16} />} color="red" title="Error">
          Failed to load connection requests. Please try again later.
        </Alert>
      </Container>
    );
  }

  const requests = data?.connections || [];
  const totalPages = data ? Math.ceil(data.total_items / perPage) : 1;

  return (
    <Container size="xl" py="xl">
      <Stack spacing="lg">
        <div>
          <Title order={3} mb="xs">
            Connection Requests
          </Title>
          <Text size="sm" c="dimmed">
            {data?.total_items || 0} pending {data?.total_items === 1 ? 'request' : 'requests'}
          </Text>
        </div>

        {requests.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">No pending connection requests</Text>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} eventId={eventId} />
            ))}
          </SimpleGrid>
        )}

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