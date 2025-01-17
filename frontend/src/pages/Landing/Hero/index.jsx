import { Container, Stack } from '@mantine/core';
import { HeroTitle } from './HeroTitle';
import { HeroTagline } from './HeroTagline';
import { HeroActions } from './HeroActions';

export const Hero = () => (
  <Container size="md">
    <Stack align="center" gap="xl" py="xl">
      <HeroTitle />
      <HeroTagline />
      <HeroActions />
    </Stack>
  </Container>
);
