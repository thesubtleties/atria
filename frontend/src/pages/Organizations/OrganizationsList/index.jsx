import { useGetOrganizationsQuery } from '@/app/features/organizations/api';
import { Container, Group, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { OrganizationCard } from './OrganizationCard';
import styles from './styles/index.module.css';

export const OrganizationsList = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetOrganizationsQuery();
  const organizations = data?.organizations || [];

  return (
    <Container className={styles.container}>
      <Group position="right" mb="xl">
        <Button
          onClick={() => navigate('/app/organizations/new')}
          className={styles.button}
          variant="default"
        >
          <Group spacing="xs">
            <IconPlus size={16} className={styles.plusIcon} />
            <span>New Organization</span>
          </Group>
        </Button>
      </Group>

      <div className={styles.grid}>
        {organizations.map((org) => (
          <OrganizationCard key={org.id} organization={org} />
        ))}
      </div>
    </Container>
  );
};
