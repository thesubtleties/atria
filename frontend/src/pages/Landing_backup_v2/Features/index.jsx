// Landing/Features/index.jsx
import { Container, Title, Text, Box } from '@mantine/core';
import { FeatureCarousel } from './FeatureCarousel';
import styles from './styles/index.module.css';

export const Features = () => (
  <section className={styles.featuresSection}>
    <Container size='lg' className={styles.featuresContainer}>
      <Box className={styles.sectionHeader}>
        <Title order={2} ta='center' className={styles.sectionTitle}>
          Powerful Features for Virtual & Hybrid Events
        </Title>
        <Text c='dimmed' ta='center' className={styles.sectionDescription}>
          Everything you need to host engaging events, connect attendees, and create memorable
          experiences
        </Text>
      </Box>
      <FeatureCarousel />
    </Container>
  </section>
);
