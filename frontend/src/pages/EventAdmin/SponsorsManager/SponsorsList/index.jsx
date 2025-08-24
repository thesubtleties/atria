import React, { useState, useMemo, useEffect } from 'react';
import { Text, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { 
  useUpdateSponsorMutation,
  useGetSponsorTiersQuery 
} from '../../../../app/features/sponsors/api';
import SponsorCard from '../SponsorCard';
import DroppableTier from '../DroppableTier';
import SponsorModal from '../SponsorModal';
import styles from './styles/index.module.css';

const SponsorsList = ({ sponsors, eventId }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [updateSponsor] = useUpdateSponsorMutation();
  const { data: allTiers = [] } = useGetSponsorTiersQuery({ eventId });
  const [localItems, setLocalItems] = useState({});

  // Initialize local items from sponsors and all tiers
  useEffect(() => {
    const grouped = {};
    
    // First, initialize all tiers (even empty ones)
    allTiers.forEach((tier) => {
      grouped[tier.id] = [];
    });
    
    // Then add sponsors to their respective tiers
    const sortedSponsors = [...sponsors].sort((a, b) => {
      const tierDiff = (a.tier_order || 999) - (b.tier_order || 999);
      if (tierDiff !== 0) return tierDiff;
      
      const aOrder = a.display_order !== null ? a.display_order : 999;
      const bOrder = b.display_order !== null ? b.display_order : 999;
      return aOrder - bOrder;
    });

    sortedSponsors.forEach((sponsor) => {
      // Only add sponsors that have a tier assigned
      if (sponsor.tier_id) {
        const tierKey = sponsor.tier_id;
        if (!grouped[tierKey]) {
          grouped[tierKey] = [];
        }
        grouped[tierKey].push(sponsor.id);
      }
    });
    
    setLocalItems(grouped);
  }, [sponsors, allTiers]);

  // Create lookups
  const tierInfo = useMemo(() => {
    const info = {};
    
    // Add all tiers from API
    allTiers.forEach((tier) => {
      info[tier.id] = {
        id: tier.id,
        name: tier.name,
        tier_order: tier.order_index || 999,
        tier_color: tier.color || null,
      };
    });
    
    // Also include any tier info from sponsors (in case of data mismatch)
    sponsors.forEach((sponsor) => {
      if (sponsor.tier_id && !info[sponsor.tier_id]) {
        info[sponsor.tier_id] = {
          id: sponsor.tier_id,
          name: sponsor.tier_name || 'Unknown Tier',
          tier_order: sponsor.tier_order || 999,
        };
      }
    });
    
    return info;
  }, [sponsors, allTiers]);

  const sponsorLookup = useMemo(() => {
    const lookup = {};
    sponsors.forEach((sponsor) => {
      lookup[sponsor.id] = sponsor;
    });
    return lookup;
  }, [sponsors]);

  const handleDragOver = (event) => {
    // Use the move helper to update local state during drag
    setLocalItems((items) => move(items, event));
  };

  const handleDragEnd = async (event) => {
    console.log('Drag end event:', event);
    const { operation } = event;
    
    if (!operation) return;
    
    const { source, target } = operation;
    
    // Extract the sponsor ID and tier information
    const draggedSponsorId = source.id;
    const draggedSponsor = sponsorLookup[draggedSponsorId];
    
    if (!draggedSponsor) {
      console.error('Could not find sponsor with id:', draggedSponsorId);
      return;
    }

    // Find which tier the sponsor is now in
    let newTierId = null;
    let newIndex = 0;
    
    for (const [tierId, sponsorIds] of Object.entries(localItems)) {
      const index = sponsorIds.indexOf(draggedSponsorId);
      if (index !== -1) {
        newTierId = tierId;
        newIndex = index;
        break;
      }
    }

    if (newTierId === null) {
      console.error('Could not find sponsor in any tier after drag');
      return;
    }

    // Calculate new display_order based on position
    let newDisplayOrder;
    const tierSponsors = localItems[newTierId] || [];
    
    if (newIndex === 0) {
      // Moving to the beginning
      const firstSponsor = tierSponsors.length > 1 ? sponsorLookup[tierSponsors[1]] : null;
      newDisplayOrder = firstSponsor ? (firstSponsor.display_order || 10) / 2 : 1;
    } else if (newIndex === tierSponsors.length - 1) {
      // Moving to the end
      const prevSponsor = sponsorLookup[tierSponsors[newIndex - 1]];
      newDisplayOrder = prevSponsor ? (prevSponsor.display_order || newIndex) + 1 : newIndex + 1;
    } else {
      // Moving between two sponsors
      const prevSponsor = sponsorLookup[tierSponsors[newIndex - 1]];
      const nextSponsor = sponsorLookup[tierSponsors[newIndex + 1]];
      
      if (prevSponsor && nextSponsor) {
        const prevOrder = prevSponsor.display_order || newIndex;
        const nextOrder = nextSponsor.display_order || newIndex + 2;
        newDisplayOrder = (prevOrder + nextOrder) / 2;
      } else {
        newDisplayOrder = newIndex + 1;
      }
    }

    // Check if tier changed
    const oldTierId = draggedSponsor.tier_id || 'no-tier';
    const tierChanged = oldTierId.toString() !== newTierId.toString();

    console.log('Tier change check:', {
      oldTierId,
      newTierId,
      tierChanged,
      draggedSponsor
    });

    try {
      const updateData = {
        sponsorId: draggedSponsorId,
        display_order: newDisplayOrder,
      };

      // If moving to a different tier
      if (tierChanged) {
        // Make sure we're passing the correct tier_id format
        if (newTierId === 'no-tier') {
          updateData.tier_id = null;
        } else {
          // Parse as integer only if it's a valid number
          const parsedTierId = parseInt(newTierId);
          updateData.tier_id = isNaN(parsedTierId) ? newTierId : parsedTierId;
        }
      }

      console.log('Updating sponsor with data:', updateData);
      await updateSponsor(updateData).unwrap();

      if (tierChanged) {
        const sourceTierName = tierInfo[oldTierId]?.name || 'No Tier';
        const targetTierName = tierInfo[newTierId]?.name || 'No Tier';
        notifications.show({
          title: 'Success',
          message: `Moved ${draggedSponsor.name} from ${sourceTierName} to ${targetTierName}`,
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Error updating sponsor:', error);
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to reorder sponsor',
        color: 'red',
      });
      
      // Revert the local state on error
      setLocalItems((items) => {
        const newItems = { ...items };
        // Remove from current position
        Object.keys(newItems).forEach(key => {
          newItems[key] = newItems[key].filter(id => id !== draggedSponsorId);
        });
        // Add back to original position
        if (!newItems[oldTierId]) {
          newItems[oldTierId] = [];
        }
        newItems[oldTierId].push(draggedSponsorId);
        return newItems;
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

  // Sort tier keys by tier_order
  const sortedTierKeys = Object.keys(localItems).sort((a, b) => {
    const aTier = tierInfo[a];
    const bTier = tierInfo[b];
    return (aTier?.tier_order || 999) - (bTier?.tier_order || 999);
  });

  return (
    <>
      <DragDropProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className={styles.sponsorsList}>
          {sortedTierKeys.map((tierId) => {
            const tierSponsors = localItems[tierId] || [];
            const tier = tierInfo[tierId];
            
            return (
              <DroppableTier
                key={tierId}
                id={tierId}
                tier={{
                  ...tier,
                  sponsors: tierSponsors.map(id => sponsorLookup[id]).filter(Boolean)
                }}
              >
                {tierSponsors.map((sponsorId, index) => {
                  const sponsor = sponsorLookup[sponsorId];
                  if (!sponsor) return null;
                  
                  return (
                    <SponsorCard
                      key={sponsorId}
                      id={sponsorId}
                      sponsor={sponsor}
                      tierId={tierId}
                      index={index}
                      onEdit={handleEditClick}
                    />
                  );
                })}
              </DroppableTier>
            );
          })}
        </div>
      </DragDropProvider>

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