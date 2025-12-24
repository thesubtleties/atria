import { useState } from 'react';
import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useGetConnectionsQuery } from '@/app/features/networking/api';
import { useSelector } from 'react-redux';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConnectionsList } from './ConnectionsList';
import type { RootState } from '@/app/store';
import type { Connection } from '@/types';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import styles from './styles/index.module.css';

export default function NetworkPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const perPage = 50;
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const { data, isLoading, error } = useGetConnectionsQuery({
    status: 'ACCEPTED',
    page,
    perPage,
  });

  // Filter connections based on search query
  const filteredConnections =
    (data?.items as Connection[] | undefined)?.filter((connection: Connection) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      // Determine the other user based on current user ID
      const otherUser =
        connection.requester.id === currentUser?.id ? connection.recipient : connection.requester;

      return (
        otherUser.full_name?.toLowerCase().includes(query) ||
        otherUser.company_name?.toLowerCase().includes(query) ||
        otherUser.title?.toLowerCase().includes(query) ||
        connection.originating_event?.title?.toLowerCase().includes(query)
      );
    }) ?? [];

  return (
    <div className={styles.pageContainer}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <PageHeader
        title='My Network'
        subtitle='Manage your professional connections across all events'
      />

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Connections</h2>
          <div className={styles.connectionCount}>{data?.total_items ?? 0} total</div>
        </div>

        <div className={styles.searchWrapper}>
          <TextInput
            placeholder='Search by name, company, title, or event...'
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput ?? ''}
            size='md'
          />
        </div>

        <ConnectionsList
          connections={filteredConnections}
          isLoading={isLoading}
          error={error as FetchBaseQueryError | SerializedError}
          {...(data ?
            { pagination: { total_pages: data.total_pages, current_page: data.current_page } }
          : {})}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}
