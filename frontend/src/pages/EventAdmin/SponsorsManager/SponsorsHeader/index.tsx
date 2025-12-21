import { Badge } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconTags, IconPlus } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons';
import { getGradientBadgeStyles } from '@/shared/hooks/useGradientBadge';
import type { Sponsor } from '@/types/sponsors';
import styles from './SponsorsHeader.module.css';

type TierCountData = {
  count: number;
  tierId: string;
  tierOrder: number;
  tierColor: string;
};

type TierCounts = {
  total?: number;
  [tierName: string]: TierCountData | number | undefined;
};

type SponsorsHeaderProps = {
  sponsors: Sponsor[];
  onCreateClick: () => void;
  onTierManageClick: () => void;
};

const SponsorsHeader = ({ sponsors, onCreateClick, onTierManageClick }: SponsorsHeaderProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const tierCounts = sponsors.reduce<TierCounts>(
    (acc, sponsor) => {
      if (!sponsor.tier_id) {
        return acc;
      }

      const tierName = sponsor.tier_name ?? 'Unknown Tier';
      const tierId = sponsor.tier_id;
      const tierColor = sponsor.tier_color;

      if (!acc[tierName] || typeof acc[tierName] === 'number') {
        acc[tierName] = {
          count: 0,
          tierId: tierId,
          tierOrder: sponsor.tier_order ?? 999,
          tierColor: tierColor,
        };
      }

      const tierData = acc[tierName] as TierCountData;
      tierData.count += 1;
      acc.total = (acc.total ?? 0) + 1;
      return acc;
    },
    { total: 0 },
  );

  const sortedTiers = Object.entries(tierCounts)
    .filter(([tier]) => tier !== 'total')
    .sort((a, b) => {
      const aData = a[1] as TierCountData;
      const bData = b[1] as TierCountData;
      return aData.tierOrder - bData.tierOrder;
    });

  return (
    <section className={styles.headerSection ?? ''}>
      <div className={styles.headerContent ?? ''}>
        <div className={styles.headerLeft ?? ''}>
          <h2 className={styles.pageTitle ?? ''}>Sponsors Management</h2>
          <div className={styles.badgeGroup ?? ''}>
            <div className={styles.badgeRow ?? ''}>
              <Badge className={styles.totalBadge ?? ''} size={isMobile ? 'md' : 'lg'} radius='sm'>
                {tierCounts.total ?? 0} Total
              </Badge>
            </div>

            {sortedTiers.length > 0 && (
              <div className={styles.badgeRow ?? ''}>
                {sortedTiers.map(([tierName, tierData]) => {
                  const tierInfo = tierData as TierCountData;
                  const color = tierInfo.tierColor;
                  const badgeStyles = color ? getGradientBadgeStyles(color) : {};

                  return (
                    <Badge
                      key={tierName}
                      className={styles.tierBadge ?? ''}
                      size={isMobile ? 'md' : 'lg'}
                      radius='sm'
                      style={badgeStyles}
                    >
                      {tierInfo.count} {tierName}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={styles.headerRight ?? ''}>
          {!isMobile && (
            <Button variant='secondary' onClick={onTierManageClick}>
              <IconTags size={18} />
              Manage Tiers
            </Button>
          )}

          <Button variant='primary' onClick={onCreateClick}>
            <IconPlus size={18} />
            Add Sponsor
          </Button>

          {isMobile && (
            <Button variant='secondary' onClick={onTierManageClick}>
              <IconTags size={18} />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SponsorsHeader;
