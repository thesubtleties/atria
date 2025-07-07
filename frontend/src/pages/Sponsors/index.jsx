import { useParams } from 'react-router-dom';
import { Title, Text, LoadingOverlay, Alert, Container } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useGetSponsorsQuery, useGetSponsorTiersQuery } from '../../app/features/sponsors/api';
import SponsorsList from './SponsorsList';

export const SponsorsPage = () => {
  const { eventId } = useParams();
  
  // Debug logging
  console.log('SponsorsPage - eventId from params:', eventId);
  
  const { 
    data: sponsors = [], 
    isLoading: sponsorsLoading, 
    error: sponsorsError 
  } = useGetSponsorsQuery({ eventId }, {
    skip: !eventId // Skip query if no eventId
  });
  
  const { 
    data: tiers = [], 
    isLoading: tiersLoading,
    error: tiersError 
  } = useGetSponsorTiersQuery({ eventId }, {
    skip: !eventId // Skip query if no eventId
  });

  const isLoading = sponsorsLoading || tiersLoading;

  // Log errors for debugging
  if (sponsorsError) {
    console.error('Sponsors API Error:', sponsorsError);
    console.error('Failed URL would be:', `/events/${eventId}/sponsors`);
    console.error('Full error details:', JSON.stringify(sponsorsError, null, 2));
  }
  if (tiersError) {
    console.error('Sponsor Tiers API Error:', tiersError);
  }

  if (isLoading) {
    return <LoadingOverlay visible={true} overlayProps={{ radius: "sm", blur: 2 }} />;
  }

  if (sponsorsError) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconInfoCircle size="1rem" />} title="Error" color="red">
          Failed to load sponsors. Please try again later.
        </Alert>
      </Container>
    );
  }

  // Filter to only show active sponsors
  const activeSponsors = sponsors.filter(sponsor => sponsor.isActive !== false);

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xs" ta="center">Sponsors</Title>
      {activeSponsors.length > 0 && (
        <Text c="dimmed" mb="xl" ta="center">
          Thank you to all our sponsors who make this event possible!
        </Text>
      )}
      
      <SponsorsList sponsors={activeSponsors} tiers={tiers} />
    </Container>
  );
};

export default SponsorsPage;