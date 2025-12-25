import { Title, Badge, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useDroppable } from '@dnd-kit/react';
import { CollisionPriority } from '@dnd-kit/abstract';
import { getGradientBadgeStyles } from '@/shared/hooks/useGradientBadge';
import type { Sponsor } from '@/types/sponsors';
import styles from './styles/index.module.css';

type DroppableTierProps = {
  id: string;
  tier: {
    id: string;
    name: string;
    tier_order: number;
    tier_color: string | null;
    sponsors: Sponsor[];
  };
  children: React.ReactNode;
};

const DroppableTier = ({ id, tier, children }: DroppableTierProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { ref, isDropTarget } = useDroppable({
    id,
    type: 'tier',
    accept: ['sponsor'],
    collisionPriority: CollisionPriority.Low,
  });

  const isOver = isDropTarget;

  const tierColor =
    tier.tier_color ?? (tier.sponsors.length > 0 ? (tier.sponsors[0]?.tier_color ?? null) : null);
  const badgeStyles = tierColor ? getGradientBadgeStyles(tierColor) : {};

  return (
    <div className={styles.tierSection ?? ''}>
      <div className={styles.tierHeader ?? ''}>
        <Title order={4} className={styles.tierTitle ?? ''}>
          {tier.name}
        </Title>
        <Badge
          size={isMobile ? 'md' : 'lg'}
          radius='sm'
          className={styles.tierBadge ?? ''}
          style={badgeStyles}
        >
          {tier.sponsors.length} sponsor{tier.sponsors.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {isMobile && tier.sponsors.length > 0 && (
        <Text className={styles.dragHint ?? ''}>Press down on cards and drag to reorder</Text>
      )}

      <div
        ref={ref}
        className={`${styles.sponsorCards ?? ''} ${isOver ? (styles.dragOver ?? '') : ''}`}
      >
        {children}
        {tier.sponsors.length === 0 && (
          <div className={styles.emptyTier ?? ''}>
            {isMobile ? 'Drag sponsors here' : 'Drop sponsors here'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DroppableTier;
