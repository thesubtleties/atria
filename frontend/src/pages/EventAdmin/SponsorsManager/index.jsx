import React, { useState } from 'react';
import { Box, Button, Group, Title, LoadingOverlay, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useGetSponsorsQuery } from '../../../app/features/sponsors/api';
import SponsorsList from './SponsorsList';
import SponsorModal from './SponsorModal';
import TierManagementModal from './TierManagementModal';
import styles from './styles/index.module.css';

const SponsorsManager = () => {
  const { eventId } = useParams();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tierModalOpen, setTierModalOpen] = useState(false);

  const { data: sponsors = [], isLoading, error, refetch } = useGetSponsorsQuery({ 
    eventId: parseInt(eventId), 
    activeOnly: false 
  });


  if (error) {
    return (
      <Box className={styles.container}>
        <Group justify="space-between" mb="xl">
          <Title order={2}>Sponsors Management</Title>
        </Group>
        <Box>
          <Text c="red">Error loading sponsors: {error.data?.message || 'Unknown error'}</Text>
          <Button mt="md" onClick={() => refetch()}>Retry</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Sponsors Management</Title>
        <Group>
          <Button
            variant="outline"
            onClick={() => setTierModalOpen(true)}
          >
            Manage Tiers
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Add Sponsor
          </Button>
        </Group>
      </Group>

      <LoadingOverlay visible={isLoading} />

      <SponsorsList 
        sponsors={sponsors} 
        eventId={parseInt(eventId)}
      />

      <SponsorModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        eventId={parseInt(eventId)}
        mode="create"
        sponsors={sponsors}
      />

      <TierManagementModal
        opened={tierModalOpen}
        onClose={() => setTierModalOpen(false)}
        eventId={parseInt(eventId)}
      />
    </Box>
  );
};

export default SponsorsManager;