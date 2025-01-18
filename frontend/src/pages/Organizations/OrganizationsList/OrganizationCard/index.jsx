import { Card, Text, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import styles from './styles/index.module.css';

export const OrganizationCard = ({ organization }) => (
  <Card
    component={Link}
    to={`/app/organizations/${organization.id}/events`}
    className={styles.card}
    padding="lg"
    radius="md"
  >
    <Group position="apart" mb="md">
      <Text weight={500} c="white" size="lg" className={styles.title}>
        {organization.name}
      </Text>
    </Group>
    <Text c="white" size="sm" className={styles.date}>
      Created {new Date(organization.created_at).toLocaleDateString()}
    </Text>
  </Card>
);
