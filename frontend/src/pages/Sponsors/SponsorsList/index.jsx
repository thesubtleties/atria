import { SimpleGrid, Title, Text, Container } from '@mantine/core';
import SponsorCard from '@/shared/components/SponsorCard';
import styles from './styles/index.module.css';

export default function SponsorsList({ sponsors, tiers }) {
  // Group sponsors by tier (handle snake_case from API)
  const sponsorsByTier = sponsors.reduce((acc, sponsor) => {
    const tierId = sponsor.tier_id || 'other';
    if (!acc[tierId]) {
      acc[tierId] = [];
    }
    acc[tierId].push(sponsor);
    return acc;
  }, {});

  // Sort tiers by order (create a copy first to avoid mutating read-only array)
  const sortedTiers = [...tiers].sort((a, b) => a.order - b.order);

  // Add "Other" tier at the end if there are sponsors without a tier
  const tiersToDisplay = [
    ...sortedTiers,
    ...(sponsorsByTier.other ? [{ id: 'other', name: 'Other Sponsors', order: 999 }] : [])
  ];

  return (
    <Container size="xl" className={styles.container}>
      {tiersToDisplay.map((tier) => {
        const tiersSponsors = sponsorsByTier[tier.id];
        if (!tiersSponsors || tiersSponsors.length === 0) return null;

        // Sort sponsors within tier by display_order (create a copy to avoid mutating)
        const sortedSponsors = [...tiersSponsors].sort((a, b) => 
          (a.display_order || 999) - (b.display_order || 999)
        );

        return (
          <div key={tier.id} className={styles.tierSection}>
            <div className={styles.tierHeader}>
              <Title order={2} className={styles.tierTitle}>
                {tier.name}
              </Title>
            </div>

            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3 }}
              spacing="xl"
              className={styles.sponsorGrid}
            >
              {sortedSponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} />
              ))}
            </SimpleGrid>
          </div>
        );
      })}

      {sponsors.length === 0 && (
        <div className={styles.noSponsors}>
          <Text size="lg" c="dimmed" ta="center">
            No sponsors yet for this event.
          </Text>
        </div>
      )}
    </Container>
  );
}