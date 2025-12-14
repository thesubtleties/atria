// Landing/Features/FeatureCard.jsx
import { Paper, Text, ThemeIcon, Title } from '@mantine/core';
import styles from './styles/FeatureCard.module.css';

export const FeatureCard = ({ title, description, icon, color }) => (
  <Paper shadow='sm' radius='md' className={styles.featureCard} withBorder>
    <ThemeIcon size={56} radius='md' color={color} className={styles.featureIcon} variant='light'>
      {icon}
    </ThemeIcon>
    <Title order={4} mt='md' mb='sm' className={styles.featureTitle}>
      {title}
    </Title>
    <Text size='sm' c='dimmed' className={styles.featureDescription}>
      {description}
    </Text>
  </Paper>
);
