import DroppableTier from '../DroppableTier';
import SponsorCard from '../SponsorCard';
import type { Sponsor } from '@/types/sponsors';
import styles from './styles/index.module.css';

type TierInfo = Record<
  string,
  {
    id: string;
    name: string;
    tier_order: number;
    tier_color: string | null;
  }
>;

type SponsorTierListProps = {
  sortedTierKeys: string[];
  localItems: Record<string, string[]>;
  tierInfo: TierInfo;
  sponsorLookup: Record<string, Sponsor>;
  onEdit: (sponsor: Sponsor) => void;
};

const SponsorTierList = ({
  sortedTierKeys,
  localItems,
  tierInfo,
  sponsorLookup,
  onEdit,
}: SponsorTierListProps) => {
  return (
    <div className={styles.sponsorsList ?? ''}>
      {sortedTierKeys.map((tierId) => {
        const tierSponsors = localItems[tierId] ?? [];
        const tier = tierInfo[tierId];

        if (!tier) return null;

        return (
          <DroppableTier
            key={tierId}
            id={tierId}
            tier={{
              id: tier.id,
              name: tier.name,
              tier_order: tier.tier_order,
              tier_color: tier.tier_color,
              sponsors: tierSponsors
                .map((id) => sponsorLookup[id])
                .filter((s): s is Sponsor => Boolean(s)),
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
                  onEdit={() => onEdit(sponsor)}
                />
              );
            })}
          </DroppableTier>
        );
      })}
    </div>
  );
};

export default SponsorTierList;
