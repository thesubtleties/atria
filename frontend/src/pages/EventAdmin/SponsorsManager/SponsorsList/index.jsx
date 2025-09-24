import { useState, useMemo, useEffect } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import {
  useUpdateSponsorMutation,
  useGetSponsorTiersQuery,
} from '../../../../app/features/sponsors/api';
import SponsorModal from '../SponsorModal';
import SponsorsEmptyState from './SponsorsEmptyState';
import SponsorTierList from './SponsorTierList';
import useSponsorDragDrop from './useSponsorDragDrop';

const SponsorsList = ({ sponsors, eventId }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [updateSponsor] = useUpdateSponsorMutation();
  const { data: allTiers = [] } = useGetSponsorTiersQuery({ eventId });

  // Build tier info lookup from all tiers and sponsors
  const tierInfo = useMemo(() => {
    const info = {};

    // First add all tiers from the API
    allTiers.forEach((tier) => {
      info[tier.id] = {
        id: tier.id,
        name: tier.name,
        description: tier.description,
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

  // Use custom hook for drag-drop functionality
  const { localItems, setLocalItems, handleDragOver, handleDragEnd } = useSponsorDragDrop(
    sponsorLookup,
    tierInfo,
    updateSponsor
  );

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
  }, [sponsors, allTiers, setLocalItems]);

  const handleEdit = (sponsor) => {
    setSelectedSponsor(sponsor);
    setEditModalOpen(true);
  };

  if (sponsors.length === 0) {
    return <SponsorsEmptyState />;
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
        <SponsorTierList
          sortedTierKeys={sortedTierKeys}
          localItems={localItems}
          tierInfo={tierInfo}
          sponsorLookup={sponsorLookup}
          onEdit={handleEdit}
        />
      </DragDropProvider>

      {editModalOpen && selectedSponsor && (
        <SponsorModal
          eventId={eventId}
          sponsor={selectedSponsor}
          mode="edit"
          opened={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSponsor(null);
          }}
        />
      )}
    </>
  );
};

export default SponsorsList;