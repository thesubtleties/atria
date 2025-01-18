import { useGetOrganizationsQuery } from '@/app/features/organizations/api';
import { SimpleGrid, Container, Group, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { OrganizationCard } from './OrganizationCard';
import styles from './styles/index.module.css';

export const OrganizationsList = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetOrganizationsQuery();
  const organizations = data?.organizations || [];

  return (
    <Container size="xl" className={styles.container}>
      <Group position="right" mb="xl">
        <Button
          onClick={() => navigate('/app/organizations/new')}
          className={styles.button}
          variant="gradient"
          gradient={{ from: '#9c42f5', to: '#6d42f5' }}
        >
          <Group spacing="xs">
            <IconPlus size={16} />
            <span>New Organization</span>
          </Group>
        </Button>
      </Group>

      <SimpleGrid
        cols={3}
        spacing="lg"
        breakpoints={[
          { maxWidth: 'md', cols: 2 },
          { maxWidth: 'sm', cols: 1 },
        ]}
      >
        {organizations.map((org) => (
          <OrganizationCard key={org.id} organization={org} />
        ))}
      </SimpleGrid>
    </Container>
  );
};
