import { useState, useMemo, useEffect } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { useUpdateSponsorMutation, useGetSponsorTiersQuery } from '@/app/features/sponsors/api';
import SponsorModal from '../SponsorModal';
import SponsorsEmptyState from './SponsorsEmptyState';
import SponsorTierList from './SponsorTierList';
import useSponsorDragDrop from './useSponsorDragDrop';
import type { Sponsor } from '@/types/sponsors';

type SponsorsListProps = {
  sponsors: Sponsor[];
  eventId: number;
};

type TierInfo = Record<
  string,
  {
    id: string;
    name: string;
    tier_order: number;
    tier_color: string | null;
  }
>;

const SponsorsList = ({ sponsors, eventId }: SponsorsListProps) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [updateSponsor] = useUpdateSponsorMutation();
  const { data: tiersResponse } = useGetSponsorTiersQuery({ eventId });

  // Backend returns array directly, map to include order_index for compatibility
  const allTiers = useMemo(
    () =>
      tiersResponse ?
        tiersResponse.map((tier) => ({
          ...tier,
          order_index: tier.order,
        }))
      : [],
    [tiersResponse],
  );

  const tierInfo = useMemo<TierInfo>(() => {
    const info: TierInfo = {};

    allTiers.forEach((tier) => {
      info[tier.id] = {
        id: tier.id,
        name: tier.name,
        tier_order: tier.order_index ?? 999,
        tier_color: tier.color ?? null,
      };
    });

    sponsors.forEach((sponsor) => {
      if (sponsor.tier_id && !info[sponsor.tier_id]) {
        info[sponsor.tier_id] = {
          id: sponsor.tier_id,
          name: sponsor.tier_name ?? 'Unknown Tier',
          tier_order: sponsor.tier_order ?? 999,
          tier_color: sponsor.tier_color ?? null,
        };
      }
    });

    return info;
  }, [sponsors, allTiers]);

  const sponsorLookup = useMemo(() => {
    const lookup: Record<string, Sponsor> = {};
    sponsors.forEach((sponsor) => {
      lookup[sponsor.id.toString()] = sponsor;
    });
    return lookup;
  }, [sponsors]);

  const { localItems, setLocalItems, handleDragOver, handleDragEnd } = useSponsorDragDrop(
    sponsorLookup,
    tierInfo,
    updateSponsor,
  );

  useEffect(() => {
    const grouped: Record<string, string[]> = {};

    allTiers.forEach((tier) => {
      grouped[tier.id] = [];
    });

    const sortedSponsors = [...sponsors].sort((a, b) => {
      const tierDiff = (a.tier_order ?? 999) - (b.tier_order ?? 999);
      if (tierDiff !== 0) return tierDiff;

      const aOrder = a.display_order ?? 999;
      const bOrder = b.display_order ?? 999;
      return aOrder - bOrder;
    });

    sortedSponsors.forEach((sponsor) => {
      if (sponsor.tier_id) {
        const tierKey = sponsor.tier_id;
        if (!grouped[tierKey]) {
          grouped[tierKey] = [];
        }
        grouped[tierKey].push(sponsor.id.toString());
      }
    });

    setLocalItems(grouped);
  }, [sponsors, allTiers, setLocalItems]);

  const handleEdit = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setEditModalOpen(true);
  };

  if (sponsors.length === 0) {
    return <SponsorsEmptyState />;
  }

  const sortedTierKeys = Object.keys(localItems).sort((a, b) => {
    const aTier = tierInfo[a];
    const bTier = tierInfo[b];
    return (aTier?.tier_order ?? 999) - (bTier?.tier_order ?? 999);
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
          mode='edit'
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
