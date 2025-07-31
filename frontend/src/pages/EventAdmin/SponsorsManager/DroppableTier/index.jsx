import React from 'react';
import { Title, Badge } from '@mantine/core';
import { useDroppable } from '@dnd-kit/react';
import { CollisionPriority } from '@dnd-kit/abstract';
import { getGradientBadgeStyles } from '../../../../shared/hooks/useGradientBadge';
import styles from './styles/index.module.css';

const DroppableTier = ({ id, tier, children }) => {
  const { ref, isOver } = useDroppable({
    id,
    type: 'tier',
    accept: ['sponsor'],
    collisionPriority: CollisionPriority.Low,
  });

  // Get the tier color from the first sponsor (they all have the same tier)
  const tierColor = tier.sponsors.length > 0 ? tier.sponsors[0].tier_color : null;
  const badgeStyles = tierColor ? getGradientBadgeStyles(tierColor) : {};

  return (
    <div className={styles.tierSection}>
      <div className={styles.tierHeader}>
        <Title order={4} className={styles.tierTitle}>
          {tier.name}
        </Title>
        <Badge 
          size="lg" 
          radius="sm"
          className={styles.tierBadge}
          style={badgeStyles}
        >
          {tier.sponsors.length} sponsor{tier.sponsors.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      <div 
        ref={ref}
        className={`${styles.sponsorCards} ${isOver ? styles.dragOver : ''}`}
      >
        {children}
        {tier.sponsors.length === 0 && (
          <div className={styles.emptyTier}>
            Drop sponsors here
          </div>
        )}
      </div>
    </div>
  );
};

export default DroppableTier;