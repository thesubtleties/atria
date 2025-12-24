import { useGetOrganizationsQuery } from '@/app/features/organizations/api';
import { Container, Group, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { OrganizationCard } from './OrganizationCard';
import { OrganizationModal } from '@/shared/components/modals/organization/OrganizationModal';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { Organization } from '@/types';

type OrganizationsResponse = {
  organizations?: Organization[];
};

export const OrganizationsList = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data } = useGetOrganizationsQuery(undefined);
  const typedData = data as OrganizationsResponse | undefined;
  const organizations = typedData?.organizations || [];

  return (
    <Container className={cn(styles.container)}>
      <Group justify='flex-end' mb='xl'>
        <Button
          onClick={() => setShowCreateModal(true)}
          className={cn(styles.button)}
          variant='default'
        >
          <Group gap='xs'>
            <IconPlus size={16} className={cn(styles.plusIcon)} />
            <span>New Organization</span>
          </Group>
        </Button>
      </Group>

      <div className={cn(styles.grid)}>
        {organizations.map((org) => (
          <OrganizationCard key={org.id} organization={org} />
        ))}
      </div>

      <OrganizationModal
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </Container>
  );
};
