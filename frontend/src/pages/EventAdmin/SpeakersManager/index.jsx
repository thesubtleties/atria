import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Group,
  TextInput,
  LoadingOverlay,
  Badge,
  ActionIcon,
  Menu,
  Text,
  Pagination,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconDownload,
  IconDots,
  IconRefresh,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { 
  useGetEventQuery,
  useGetEventUsersAdminQuery,
} from '@/app/features/events/api';
import { Button } from '../../../shared/components/buttons';
import SpeakersList from './SpeakersList';
import SpeakerEditModal from './SpeakerEditModal';
import AddSpeakerModal from './AddSpeakerModal';
import styles from './styles/index.module.css';

const SpeakersManager = () => {
  const { eventId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editModalData, setEditModalData] = useState({ open: false, speaker: null });
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Fetch event details
  const { data: eventData } = useGetEventQuery(eventId);
  const currentUserRole = eventData?.user_role || 'ATTENDEE';

  // Fetch speakers with pagination
  const {
    data: speakersData,
    isLoading,
    error,
    refetch,
  } = useGetEventUsersAdminQuery({
    eventId,
    page,
    per_page: 50,
    role: 'SPEAKER',
  });

  const handleExport = () => {
    notifications.show({
      title: 'Export Started',
      message: 'Preparing speakers list for download...',
      color: 'blue',
    });
    // TODO: Implement CSV export
  };

  const handleEditSpeaker = (speaker) => {
    setEditModalData({ open: true, speaker });
  };

  const handleAddSpeaker = () => {
    setAddModalOpen(true);
  };

  // Filter speakers based on search
  const filteredSpeakers = speakersData?.event_users?.filter((speaker) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      speaker.full_name?.toLowerCase().includes(searchLower) ||
      speaker.email?.toLowerCase().includes(searchLower) ||
      speaker.company_name?.toLowerCase().includes(searchLower) ||
      speaker.speaker_title?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Count session assignments
  const speakerCounts = {
    total: speakersData?.total_items || 0,
    withSessions: speakersData?.event_users?.filter(s => s.session_count > 0).length || 0,
    withoutSessions: speakersData?.event_users?.filter(s => s.session_count === 0).length || 0,
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        
        <div className={styles.contentWrapper}>
          <section className={styles.mainContent}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Text c="red" size="lg" mb="md">
                Error loading speakers: {error.message}
              </Text>
              <Button 
                variant="primary"
                onClick={refetch}
              >
                Retry
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <section className={styles.headerSection}>
          <Group justify="space-between" align="flex-start">
            <div>
              <h2 className={styles.pageTitle}>Speakers Management</h2>
              <div className={styles.badgeGroup}>
                <Badge className={styles.statsBadge} size="lg" variant="light" radius="sm">
                  {speakerCounts.total} Total
                </Badge>
                <Badge size="lg" variant="light" color="green" radius="sm">
                  {speakerCounts.withSessions} Assigned
                </Badge>
                <Badge size="lg" variant="light" color="gray" radius="sm">
                  {speakerCounts.withoutSessions} Unassigned
                </Badge>
              </div>
            </div>
            <Group>
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon className={styles.actionIcon} variant="subtle" size="lg">
                    <IconDots size={20} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown className={styles.menuDropdown}>
                  <Menu.Item
                    className={styles.menuItem}
                    leftSection={<IconDownload size={16} />}
                    onClick={handleExport}
                  >
                    Export to CSV
                  </Menu.Item>
                  <Menu.Item
                    className={styles.menuItem}
                    leftSection={<IconRefresh size={16} />}
                    onClick={refetch}
                  >
                    Refresh List
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              <Button
                variant="primary"
                onClick={handleAddSpeaker}
              >
                <IconPlus size={18} />
                Add Speaker
              </Button>
            </Group>
          </Group>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          <div className={styles.searchContainer}>
            <TextInput
              className={styles.searchInput}
              placeholder="Search speakers by name, email, company, or title..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="md"
            />
          </div>

          <LoadingOverlay visible={isLoading} />
          <SpeakersList
            speakers={filteredSpeakers}
            currentUserRole={currentUserRole}
            onEditSpeaker={handleEditSpeaker}
            organizationId={eventData?.organization_id}
          />
          
          {speakersData?.total_pages > 1 && (
            <Group justify="center" mt="xl">
              <Pagination
                value={page}
                onChange={setPage}
                total={speakersData.total_pages}
              />
            </Group>
          )}
        </section>

        <SpeakerEditModal
          opened={editModalData.open}
          onClose={() => setEditModalData({ open: false, speaker: null })}
          speaker={editModalData.speaker}
          eventId={eventId}
          onSuccess={refetch}
        />

        <AddSpeakerModal
          opened={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          eventId={eventId}
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