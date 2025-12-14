// app/features/landing/components/ero/index.jsx
import { Container, Stack } from '@mantine/core';
import { HeroTitle } from './HeroTitle';
import { HeroTagline } from './HeroTagline';
import { HeroActions } from './HeroActions';
import styles from './styles/index.module.css';

export const Hero = () => (
  <section className={styles.heroSection}>
    <div className={styles.heroBackground} />
    <Container size='md' className={styles.heroContainer}>
      <Stack align='center' gap='xl' className={styles.heroContent}>
        <HeroTitle />
        <HeroTagline />
        <HeroActions />
      </Stack>
    </Container>
  </section>
);
