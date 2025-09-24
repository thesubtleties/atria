import { useState } from 'react';
import { move } from '@dnd-kit/helpers';
import { notifications } from '@mantine/notifications';

const useSponsorDragDrop = (sponsorLookup, tierInfo, updateSponsor) => {
  const [localItems, setLocalItems] = useState({});

  const handleDragOver = (event) => {
    // Use the move helper to update local state during drag
    setLocalItems((items) => move(items, event));
  };

  const handleDragEnd = async (event) => {
    console.log('Drag end event:', event);
    const { operation } = event;

    if (!operation) return;

    const { source } = operation;

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

    if (!newTierId) {
      console.error('Could not determine new tier for sponsor');
      return;
    }

    // Get all sponsor IDs in the new tier (after the move)
    const sponsorIdsInNewTier = localItems[newTierId] || [];

    // Calculate new display_order based on position
    let newDisplayOrder;

    if (sponsorIdsInNewTier.length === 1) {
      // Only sponsor in tier (just moved here)
      newDisplayOrder = 10;
    } else if (newIndex === 0) {
      // Moved to beginning
      const nextId = sponsorIdsInNewTier[1];
      const nextSponsor = nextId ? sponsorLookup[nextId] : null;
      newDisplayOrder = nextSponsor ? nextSponsor.display_order / 2 : 5;
    } else if (newIndex === sponsorIdsInNewTier.length - 1) {
      // Moved to end
      const prevId = sponsorIdsInNewTier[newIndex - 1];
      const prevSponsor = prevId ? sponsorLookup[prevId] : null;
      newDisplayOrder = prevSponsor ? prevSponsor.display_order + 10 : (newIndex + 1) * 10;
    } else {
      // Moved between two sponsors
      const prevId = sponsorIdsInNewTier[newIndex - 1];
      const nextId = sponsorIdsInNewTier[newIndex + 1];
      const prevSponsor = prevId ? sponsorLookup[prevId] : null;
      const nextSponsor = nextId ? sponsorLookup[nextId] : null;

      if (prevSponsor && nextSponsor) {
        newDisplayOrder = (prevSponsor.display_order + nextSponsor.display_order) / 2;
      } else {
        newDisplayOrder = (newIndex + 1) * 10;
      }
    }

    // Tier IDs are strings (e.g., "platinum", "gold", "silver")
    const oldTierId = draggedSponsor.tier_id || null;
    const newTierIdStr = newTierId; // Keep as string

    console.log('Moving sponsor:', {
      sponsorId: draggedSponsor.id,
      sponsorName: draggedSponsor.name,
      fromTier: oldTierId,
      toTier: newTierIdStr,
      newIndex,
      newDisplayOrder
    });

    // Check if tier actually changed
    const tierChanged = oldTierId !== newTierIdStr;

    try {
      // Update the sponsor in the backend
      await updateSponsor({
        sponsorId: draggedSponsor.id,
        tier_id: newTierIdStr, // Send as string
        display_order: newDisplayOrder,
      }).unwrap();

      if (tierChanged) {
        const sourceTierName = tierInfo[oldTierId]?.name || 'No Tier';
        const targetTierName = tierInfo[newTierId]?.name || 'No Tier';

        notifications.show({
          message: `Moved ${draggedSponsor.name} from ${sourceTierName} to ${targetTierName}`,
          color: 'green',
        });
      } else {
        notifications.show({
          message: `Reordered ${draggedSponsor.name} within ${tierInfo[newTierId]?.name || 'tier'}`,
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Failed to update sponsor:', error);
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update sponsor position',
        color: 'red',
      });

      // Revert local state on error
      const grouped = {};

      // Re-initialize all tiers
      Object.keys(tierInfo).forEach((tierId) => {
        grouped[tierId] = [];
      });

      // Re-add sponsors to their original positions
      Object.values(sponsorLookup).forEach((sponsor) => {
        if (sponsor.tier_id) {
          const tierKey = sponsor.tier_id;
          if (!grouped[tierKey]) {
            grouped[tierKey] = [];
          }
          grouped[tierKey].push(sponsor.id);
        }
      });

      setLocalItems(grouped);
    }
  };

  return {
    localItems,
    setLocalItems,
    handleDragOver,
    handleDragEnd,
  };
};

export default useSponsorDragDrop;