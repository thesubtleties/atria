import React, { useState, useRef, useMemo } from 'react';
import { Table, Text, Box, Title, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useUpdateSponsorMutation } from '../../../../app/features/sponsors/api';
import SponsorRow from '../SponsorRow';
import SponsorModal from '../SponsorModal';
import styles from './styles/index.module.css';

const SponsorsList = ({ sponsors, eventId }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [draggedSponsor, setDraggedSponsor] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragOverTier, setDragOverTier] = useState(null);
  const draggedOverRef = useRef(null);
  const [updateSponsor] = useUpdateSponsorMutation();

  // Group sponsors by tier with proper sorting
  const sponsorsByTier = useMemo(() => {
    // First, sort all sponsors by tier_order then display_order
    const sortedSponsors = [...sponsors].sort((a, b) => {
      const tierDiff = (a.tier_order || 999) - (b.tier_order || 999);
      if (tierDiff !== 0) return tierDiff;
      
      // Handle null display_order by treating as very large number
      const aOrder = a.display_order !== null ? a.display_order : 999;
      const bOrder = b.display_order !== null ? b.display_order : 999;
      return aOrder - bOrder;
    });

    // Then group by tier
    const grouped = {};
    sortedSponsors.forEach((sponsor) => {
      const tierKey = sponsor.tier_id || 'no-tier';
      if (!grouped[tierKey]) {
        grouped[tierKey] = {
          id: sponsor.tier_id,
          name: sponsor.tier_name || 'No Tier',
          tier_order: sponsor.tier_order || 999,
          sponsors: []
        };
      }
      grouped[tierKey].sponsors.push(sponsor);
    });
    
    // Sort tiers by tier_order
    return Object.values(grouped).sort((a, b) => {
      return a.tier_order - b.tier_order;
    });
  }, [sponsors]);

  // Get global index for a sponsor
  const getGlobalIndex = (tierIndex, sponsorIndex) => {
    let globalIndex = 0;
    for (let i = 0; i < tierIndex; i++) {
      globalIndex += sponsorsByTier[i].sponsors.length;
    }
    return globalIndex + sponsorIndex;
  };


  const handleDragStart = (e, sponsor, tierIndex, sponsorIndex) => {
    const globalIndex = getGlobalIndex(tierIndex, sponsorIndex);
    setDraggedSponsor({ sponsor, globalIndex, tierIndex, sponsorIndex });
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedSponsor(null);
    setDragOverIndex(null);
    setDragOverTier(null);
  };

  const handleDragOver = (e, tierIndex, sponsorIndex) => {
    e.preventDefault();
    if (!draggedSponsor) return;
    
    e.dataTransfer.dropEffect = 'move';
    
    const globalIndex = getGlobalIndex(tierIndex, sponsorIndex);
    if (dragOverIndex !== globalIndex || dragOverTier !== tierIndex) {
      setDragOverIndex(globalIndex);
      setDragOverTier(tierIndex);
      draggedOverRef.current = globalIndex;
    }
  };

  const handleDrop = async (e, targetTierIndex, targetSponsorIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDragOverTier(null);
    
    if (!draggedSponsor) {
      return;
    }

    const { sponsor, tierIndex: sourceTierIndex, sponsorIndex: sourceSponsorIndex } = draggedSponsor;
    const targetTier = sponsorsByTier[targetTierIndex];
    const targetTierSponsors = targetTier.sponsors;
    
    // Don't do anything if dropping in the same position
    if (sourceTierIndex === targetTierIndex && sourceSponsorIndex === targetSponsorIndex) {
      return;
    }

    // Calculate the new display_order using fractional indexing
    let newDisplayOrder;
    
    // Create a temporary array without the dragged item if moving within same tier
    let adjustedSponsors = targetTierSponsors;
    if (sourceTierIndex === targetTierIndex) {
      adjustedSponsors = targetTierSponsors.filter((_, idx) => idx !== sourceSponsorIndex);
    }
    
    if (adjustedSponsors.length === 0) {
      // First sponsor in this tier
      newDisplayOrder = 10.0;
    } else if (targetSponsorIndex === 0) {
      // Inserting at the beginning
      const firstSponsor = adjustedSponsors[0];
      const firstOrder = firstSponsor.display_order || 10.0;
      // Ensure we never go below 0.1 to avoid getting too close to 0
      newDisplayOrder = Math.max(0.1, firstOrder / 2);
    } else if (targetSponsorIndex >= adjustedSponsors.length) {
      // Inserting at the end
      const lastSponsor = adjustedSponsors[adjustedSponsors.length - 1];
      newDisplayOrder = (lastSponsor.display_order || adjustedSponsors.length) + 1.0;
    } else {
      // Inserting between two sponsors
      // Adjust targetSponsorIndex if we removed an item before it
      let adjustedTargetIndex = targetSponsorIndex;
      if (sourceTierIndex === targetTierIndex && sourceSponsorIndex < targetSponsorIndex) {
        adjustedTargetIndex--;
      }
      
      const prevIndex = adjustedTargetIndex - 1;
      const nextIndex = adjustedTargetIndex;
      
      const prevSponsor = adjustedSponsors[prevIndex];
      const nextSponsor = adjustedSponsors[nextIndex];
      
      if (!prevSponsor || !nextSponsor) {
        console.error('Invalid sponsor indices:', { 
          prevIndex, 
          nextIndex, 
          adjustedTargetIndex,
          adjustedSponsors: adjustedSponsors.map(s => s.name),
          targetSponsorIndex,
          sourceSponsorIndex
        });
        return;
      }
      
      const prevOrder = prevSponsor.display_order || prevIndex + 1;
      const nextOrder = nextSponsor.display_order || nextIndex + 1;
      newDisplayOrder = (prevOrder + nextOrder) / 2;
    }

    // Check if we're moving to a different tier
    const tierChanged = sourceTierIndex !== targetTierIndex;

    try {
      // Update the sponsor with new display_order and optionally new tier
      const updateData = {
        sponsorId: sponsor.id,
        display_order: newDisplayOrder,
      };
      
      if (tierChanged && targetTier.id) {
        updateData.tier_id = targetTier.id;
      }
      
      await updateSponsor(updateData).unwrap();
      
      if (tierChanged) {
        notifications.show({
          title: 'Success',
          message: `Moved ${sponsor.name} to ${targetTier.name}`,
          color: 'green',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to reorder sponsor',
        color: 'red',
      });
    }
  };

  const handleEditClick = (sponsor) => {
    setSelectedSponsor(sponsor);
    setEditModalOpen(true);
  };

  if (sponsors.length === 0) {
    return (
      <Box className={styles.emptyState}>
        <Text c="dimmed" ta="center">
          No sponsors added yet. Click "Add Sponsor" to get started.
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing="xl">
        {sponsorsByTier.map((tier, tierIndex) => (
          <Box key={tier.id || 'no-tier'} className={styles.tierSection}>
            <Box className={styles.tierHeader}>
              <Title order={4} c="dimmed">
                {tier.name}
              </Title>
              <Text size="sm" c="dimmed">
                ({tier.sponsors.length} sponsor{tier.sponsors.length !== 1 ? 's' : ''})
              </Text>
            </Box>
            <Table style={{ tableLayout: 'fixed' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '30px' }} />
                  <Table.Th style={{ width: '70px', textAlign: 'center' }}>Logo</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th style={{ width: '90px', textAlign: 'center' }}>Status</Table.Th>
                  <Table.Th style={{ width: '70px', textAlign: 'center' }}>Featured</Table.Th>
                  <Table.Th style={{ width: '70px', textAlign: 'center' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {tier.sponsors.map((sponsor, sponsorIndex) => {
                  const globalIndex = getGlobalIndex(tierIndex, sponsorIndex);
                  return (
                    <SponsorRow
                      key={sponsor.id}
                      sponsor={sponsor}
                      index={globalIndex}
                      onEdit={handleEditClick}
                      onDragStart={(e) => handleDragStart(e, sponsor, tierIndex, sponsorIndex)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, tierIndex, sponsorIndex)}
                      onDrop={(e) => handleDrop(e, tierIndex, sponsorIndex)}
                      isDragging={draggedSponsor?.sponsor.id === sponsor.id}
                      isDragOver={dragOverIndex === globalIndex && draggedSponsor?.globalIndex !== globalIndex}
                    />
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>
        ))}
      </Stack>

      {editModalOpen && (
        <SponsorModal
          opened={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSponsor(null);
          }}
          eventId={eventId}
          mode="edit"
          sponsor={selectedSponsor}
          sponsors={sponsors}
        />
      )}
    </>
  );
};

export default SponsorsList;