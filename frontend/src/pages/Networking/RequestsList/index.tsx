import { useState } from 'react';
import { Text, Center, Pagination, Alert } from '@mantine/core';
import { LoadingSpinner } from '@/shared/components/loading';
import { IconInfoCircle } from '@tabler/icons-react';
import { useGetPendingConnectionsQuery } from '@/app/features/networking/api';
import { RequestCard } from './RequestCard';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type Requester = {
  full_name?: string;
  title?: string;
  company_name?: string;
  image_url?: string;
  email?: string;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
};

export type ConnectionRequest = {
  id: number;
  requester: Requester;
  icebreaker_message?: string;
  created_at: string;
};

type PendingConnectionsResponse = {
  connections?: ConnectionRequest[];
  total_items?: number;
};

export function RequestsList() {
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading, error } = useGetPendingConnectionsQuery({
    page,
    perPage,
  });

  const typedData = data as PendingConnectionsResponse | undefined;

  if (isLoading) {
    return (
      <Center className={cn(styles.loader)}>
        <LoadingSpinner size='lg' />
      </Center>
    );
  }

  if (error) {
    return (
      <div className={cn(styles.container)}>
        <div className={cn(styles.errorState)}>
          <Alert icon={<IconInfoCircle size={16} />} color='red' title='Error'>
            Failed to load connection requests. Please try again later.
          </Alert>
        </div>
      </div>
    );
  }

  const requests = typedData?.connections || [];
  const totalPages = typedData ? Math.ceil((typedData.total_items || 0) / perPage) : 1;

  return (
    <div className={cn(styles.container)}>
      {/* Header */}
      <div className={cn(styles.header)}>
        <h3 className={cn(styles.title)}>Connection Requests</h3>
        <Text className={cn(styles.subtitle)}>
          {typedData?.total_items || 0} pending{' '}
          {typedData?.total_items === 1 ? 'request' : 'requests'}
        </Text>
      </div>

      {/* Content */}
      <div className={cn(styles.content)}>
        {requests.length === 0 ?
          <div className={cn(styles.emptyState)}>
            <Text c='dimmed'>No pending connection requests</Text>
          </div>
        : <div className={cn(styles.requestGrid)}>
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={cn(styles.paginationContainer)}>
          <Pagination value={page} onChange={setPage} total={totalPages} size='md' withEdges />
        </div>
      )}
    </div>
  );
}
