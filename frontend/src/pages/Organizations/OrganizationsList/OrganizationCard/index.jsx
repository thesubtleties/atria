import { Text, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import styles from './styles/index.module.css';

export const OrganizationCard = ({ organization }) => (
  <Link
    to={`/app/organizations/${organization.id}/events`}
    className={styles.card}
  >
    <Group position="apart" mb="md">
      <Text className={styles.title}>{organization.name}</Text>
    </Group>
    <Text className={styles.date}>
      Created {new Date(organization.created_at).toLocaleDateString()}
    </Text>
  </Link>
);
