import { useState } from 'react';
import { move } from '@dnd-kit/helpers';
import { notifications } from '@mantine/notifications';
import type { Sponsor } from '@/types/sponsors';

type SponsorLookup = Record<string, Sponsor>;

type TierInfo = Record<
  string,
  {
    name: string;
    order: number;
    color: string;
  }
>;

type LocalItems = Record<string, string[]>;

type DragEndEvent = Parameters<typeof move>[1];

type UpdateSponsorMutation = {
  (args: { sponsorId: number; tier_id: string; display_order: number }): {
    unwrap: () => Promise<void>;
  };
};

type UseSponsorDragDropResult = {
  localItems: LocalItems;
  setLocalItems: React.Dispatch<React.SetStateAction<LocalItems>>;
  handleDragOver: (event: DragEndEvent) => void;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
};

const useSponsorDragDrop = (
  sponsorLookup: SponsorLookup,
  tierInfo: TierInfo,
  updateSponsor: UpdateSponsorMutation,
): UseSponsorDragDropResult => {
  const [localItems, setLocalItems] = useState<LocalItems>({});

  const handleDragOver = (event: DragEndEvent): void => {
    // Use the move helper to update local state during drag
    setLocalItems((items) => move(items, event));
  };

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    console.log('Drag end event:', event);
    const { operation } = event;

    if (!operation) return;

    const { source } = operation;

    if (!source) return;

    // Extract the sponsor ID and tier information
    const draggedSponsorId = String(source.id);
    const draggedSponsor = sponsorLookup[draggedSponsorId];

    if (!draggedSponsor) {
      console.error('Could not find sponsor with id:', draggedSponsorId);
      return;
    }

    // Find which tier the sponsor is now in
    let newTierId: string | null = null;
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
    let newDisplayOrder: number;

    if (sponsorIdsInNewTier.length === 1) {
      // Only sponsor in tier (just moved here)
      newDisplayOrder = 10;
    } else if (newIndex === 0) {
      // Moved to beginning
      const nextId = sponsorIdsInNewTier[1];
      const nextSponsor = nextId ? sponsorLookup[nextId] : null;
      newDisplayOrder = nextSponsor?.display_order ? nextSponsor.display_order / 2 : 5;
    } else if (newIndex === sponsorIdsInNewTier.length - 1) {
      // Moved to end
      const prevId = sponsorIdsInNewTier[newIndex - 1];
      const prevSponsor = prevId ? sponsorLookup[prevId] : null;
      newDisplayOrder =
        prevSponsor?.display_order ? prevSponsor.display_order + 10 : (newIndex + 1) * 10;
    } else {
      // Moved between two sponsors
      const prevId = sponsorIdsInNewTier[newIndex - 1];
      const nextId = sponsorIdsInNewTier[newIndex + 1];
      const prevSponsor = prevId ? sponsorLookup[prevId] : null;
      const nextSponsor = nextId ? sponsorLookup[nextId] : null;

      if (prevSponsor?.display_order && nextSponsor?.display_order) {
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
      newDisplayOrder,
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
        const sourceTierName = oldTierId ? tierInfo[oldTierId]?.name || 'No Tier' : 'No Tier';
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
      const errorMessage =
        error && typeof error === 'object' && 'data' in error ?
          (error.data as { message?: string })?.message
        : undefined;

      notifications.show({
        title: 'Error',
        message: errorMessage || 'Failed to update sponsor position',
        color: 'red',
      });

      // Revert local state on error
      const grouped: LocalItems = {};

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
          grouped[tierKey].push(String(sponsor.id));
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
