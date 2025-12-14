import DroppableTier from '../DroppableTier';
import SponsorCard from '../SponsorCard';
import styles from './styles/index.module.css';

const SponsorTierList = ({ sortedTierKeys, localItems, tierInfo, sponsorLookup, onEdit }) => {
  return (
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
              sponsors: tierSponsors.map((id) => sponsorLookup[id]).filter(Boolean),
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
