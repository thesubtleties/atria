import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Group, TextInput, Badge, Text, Pagination } from '@mantine/core';
import { LoadingOverlay } from '@/shared/components/loading';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useGetEventQuery, useGetEventUsersAdminQuery } from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import SpeakersList from './SpeakersList';
import SpeakerEditModal from './SpeakerEditModal';
import AddSpeakerModal from './AddSpeakerModal';
import type { EventUser } from '@/types';
import styles from './styles/index.module.css';

type EditModalData = {
  open: boolean;
  speaker: EventUser | null;
};

const SpeakersManager = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editModalData, setEditModalData] = useState<EditModalData>({
    open: false,
    speaker: null,
  });
  const [addModalOpen, setAddModalOpen] = useState(false);

  const numericEventId = eventId ? parseInt(eventId, 10) : 0;

  const { data: eventData } = useGetEventQuery({ id: numericEventId }, { skip: !eventId });
  const currentUserRole = eventData?.user_role ?? 'ATTENDEE';

  const {
    data: speakersData,
    isLoading,
    error,
    refetch,
  } = useGetEventUsersAdminQuery(
    {
      eventId: numericEventId,
      page,
      per_page: 50,
      role: 'SPEAKER',
    },
    {
      skip: !eventId,
    },
  );

  const handleEditSpeaker = (speaker: EventUser) => {
    setEditModalData({ open: true, speaker });
  };

  const handleAddSpeaker = () => {
    setAddModalOpen(true);
  };

  const filteredSpeakers =
    ((speakersData as { event_users?: EventUser[] })?.event_users ?? []).filter((speaker) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        speaker.full_name?.toLowerCase().includes(searchLower) ||
        speaker.email?.toLowerCase().includes(searchLower) ||
        speaker.company_name?.toLowerCase().includes(searchLower) ||
        speaker.speaker_title?.toLowerCase().includes(searchLower)
      );
    }) ?? [];

  const eventUsers = (speakersData as { event_users?: EventUser[] })?.event_users ?? [];
  const speakerCounts = {
    total: speakersData?.total_items ?? 0,
    withSessions: eventUsers.filter((s) => (s.session_count ?? 0) > 0).length,
    withoutSessions: eventUsers.filter((s) => (s.session_count ?? 0) === 0).length,
  };

  if (error) {
    return (
      <div className={styles.container ?? ''}>
        <div className={styles.bgShape1 ?? ''} />
        <div className={styles.bgShape2 ?? ''} />

        <div className={styles.contentWrapper ?? ''}>
          <section className={styles.mainContent ?? ''}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Text c='red' size='lg' mb='md'>
                Error loading speakers:{' '}
                {error && typeof error === 'object' && 'message' in error ?
                  String(error.message)
                : 'Unknown error'}
              </Text>
              <Button variant='primary' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container ?? ''}>
      <div className={styles.bgShape1 ?? ''} />
      <div className={styles.bgShape2 ?? ''} />

      <div className={styles.contentWrapper ?? ''}>
        <section className={styles.headerSection ?? ''}>
          <div className={styles.headerContent ?? ''}>
            <div className={styles.headerLeft ?? ''}>
              <h2 className={styles.pageTitle ?? ''}>Speakers Management</h2>
              <div className={styles.badgeGroup ?? ''}>
                <div className={styles.badgeRow ?? ''}>
                  <Badge className={styles.totalBadge ?? ''} size='md' radius='sm'>
                    {speakerCounts.total} Total
                  </Badge>
                </div>
                <div className={styles.badgeRow ?? ''}>
                  <Badge className={styles.assignedBadge ?? ''} size='md' radius='sm'>
                    {speakerCounts.withSessions} Assigned
                  </Badge>
                  <Badge className={styles.unassignedBadge ?? ''} size='md' radius='sm'>
                    {speakerCounts.withoutSessions} Unassigned
                  </Badge>
                </div>
              </div>
            </div>
            <div className={styles.headerRight ?? ''}>
              <Button
                variant='primary'
                onClick={handleAddSpeaker}
                className={styles.addButton ?? ''}
              >
                <IconPlus size={18} />
                Add Speaker
              </Button>
            </div>
          </div>
        </section>

        <section className={styles.mainContent ?? ''}>
          <div className={styles.searchContainer ?? ''}>
            <TextInput
              className={styles.searchInput ?? ''}
              placeholder='Search speakers by name, email, company, or title...'
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size='md'
            />
          </div>

          <LoadingOverlay visible={isLoading ?? false} />
          <SpeakersList
            speakers={filteredSpeakers}
            currentUserRole={currentUserRole}
            onEditSpeaker={handleEditSpeaker}
          />

          {(speakersData?.total_pages ?? 0) > 1 && (
            <Group justify='center' mt='xl'>
              <Pagination
                value={page}
                onChange={setPage}
                total={speakersData?.total_pages ?? 1}
                className={styles.pagination ?? ''}
              />
            </Group>
          )}
        </section>

        <SpeakerEditModal
          opened={editModalData.open}
          onClose={() => setEditModalData({ open: false, speaker: null })}
          speaker={editModalData.speaker}
          eventId={numericEventId}
          onSuccess={refetch}
        />

        <AddSpeakerModal
          opened={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          eventId={numericEventId}
          onSuccess={() => {
            refetch();
            setAddModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default SpeakersManager;
