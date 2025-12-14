import { Title, Badge, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useDroppable } from '@dnd-kit/react';
import { CollisionPriority } from '@dnd-kit/abstract';
import { getGradientBadgeStyles } from '../../../../shared/hooks/useGradientBadge';
import styles from './styles/index.module.css';

const DroppableTier = ({ id, tier, children }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { ref, isOver } = useDroppable({
    id,
    type: 'tier',
    accept: ['sponsor'],
    collisionPriority: CollisionPriority.Low,
  });

  // Get the tier color from the tier itself
  const tierColor =
    tier.tier_color || (tier.sponsors.length > 0 ? tier.sponsors[0].tier_color : null);
  const badgeStyles = tierColor ? getGradientBadgeStyles(tierColor) : {};

  return (
    <div className={styles.tierSection}>
      <div className={styles.tierHeader}>
        <Title order={4} className={styles.tierTitle}>
          {tier.name}
        </Title>
        <Badge
          size={isMobile ? 'md' : 'lg'}
          radius='sm'
          className={styles.tierBadge}
          style={badgeStyles}
        >
          {tier.sponsors.length} sponsor{tier.sponsors.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Mobile drag hint */}
      {isMobile && tier.sponsors.length > 0 && (
        <Text className={styles.dragHint}>Press down on cards and drag to reorder</Text>
      )}

      <div ref={ref} className={`${styles.sponsorCards} ${isOver ? styles.dragOver : ''}`}>
        {children}
        {tier.sponsors.length === 0 && (
          <div className={styles.emptyTier}>
            {isMobile ? 'Drag sponsors here' : 'Drop sponsors here'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DroppableTier;
