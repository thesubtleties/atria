import { useState } from 'react';
import { Text, Center, Pagination, Alert } from '@mantine/core';
import { LoadingSpinner } from '../../../shared/components/loading';
import { IconInfoCircle } from '@tabler/icons-react';
import { useGetPendingConnectionsQuery } from '@/app/features/networking/api';
import { RequestCard } from './RequestCard';
import styles from './styles/index.module.css';

export function RequestsList() {
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading, error } = useGetPendingConnectionsQuery({
    page,
    perPage,
  });

  if (isLoading) {
    return (
      <Center className={styles.loader}>
        <LoadingSpinner size='lg' />
      </Center>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <Alert icon={<IconInfoCircle size={16} />} color='red' title='Error'>
            Failed to load connection requests. Please try again later.
          </Alert>
        </div>
      </div>
    );
  }

  const requests = data?.connections || [];
  const totalPages = data ? Math.ceil(data.total_items / perPage) : 1;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Connection Requests</h3>
        <Text className={styles.subtitle}>
          {data?.total_items || 0} pending {data?.total_items === 1 ? 'request' : 'requests'}
        </Text>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {requests.length === 0 ?
          <div className={styles.emptyState}>
            <Text c='dimmed'>No pending connection requests</Text>
          </div>
        : <div className={styles.requestGrid}>
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <Pagination value={page} onChange={setPage} total={totalPages} size='md' withEdges />
        </div>
      )}
    </div>
  );
}
