import { Table, ScrollArea, Alert, Center, Pagination } from '@mantine/core';
import { LoadingOverlay } from '@/shared/components/loading';
import { ConnectionRow } from '../ConnectionRow';
import { ConnectionCard } from '../ConnectionCard';
import type { Connection } from '@/types';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import styles from './styles/index.module.css';

type PaginationInfo = {
  total_pages: number;
  current_page: number;
};

type ConnectionsListProps = {
  connections: Connection[];
  isLoading: boolean;
  error?: FetchBaseQueryError | SerializedError;
  pagination?: PaginationInfo;
  onPageChange: (page: number) => void;
};

export function ConnectionsList({
  connections,
  isLoading,
  error,
  pagination,
  onPageChange,
}: ConnectionsListProps) {
  if (error) {
    const errorMessage =
      'message' in error ? error.message : 'Failed to load connections. Please try again.';
    return (
      <Alert color='red' title='Error loading connections'>
        {errorMessage}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible={isLoading} />
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <Alert color='blue' title='No connections yet'>
        Start building your network by connecting with attendees at events!
      </Alert>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={styles.desktopView}>
        <ScrollArea>
          <Table className={styles.table ?? ''}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Title & Company</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Connected At</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Links</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Connected</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {connections.map((connection) => (
                <ConnectionRow key={connection.id} connection={connection} />
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </div>

      {/* Mobile Card View */}
      <div className={styles.mobileView}>
        <div className={styles.connectionGrid}>
          {connections.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>
      </div>

      {pagination && pagination.total_pages > 1 && (
        <Center className={styles.pagination ?? ''}>
          <Pagination
            total={pagination.total_pages}
            value={pagination.current_page}
            onChange={onPageChange}
          />
        </Center>
      )}
    </>
  );
}
