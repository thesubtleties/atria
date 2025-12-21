import { Text, ActionIcon, Group, Modal, Button } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useState, type MouseEvent } from 'react';
import { useSelector } from 'react-redux';
import { OrganizationModal } from '@/shared/components/modals/organization/OrganizationModal';
import type { Organization as OrganizationType } from '@/types';
import { useDeleteOrganizationMutation } from '@/app/features/organizations/api';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { RootState } from '@/types';

type OrganizationUser = {
  id: number;
  role: string;
};

type Organization = {
  id: number;
  name: string;
  created_at: string;
  updated_at?: string;
  users?: OrganizationUser[];
};

type OrganizationCardProps = {
  organization: Organization;
};

export const OrganizationCard = ({ organization }: OrganizationCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const [deleteOrganization] = useDeleteOrganizationMutation();

  const canEdit = organization.users?.some(
    (user) => user.id === currentUserId && ['OWNER', 'ADMIN'].includes(user.role),
  );

  const isOwner = organization.users?.some(
    (user) => user.id === currentUserId && user.role === 'OWNER',
  );

  const handleEditClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleDeleteClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteOrganization(organization.id).unwrap();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete organization:', error);
    }
  };

  return (
    <>
      <div className={cn(styles.cardWrapper)}>
        <Link to={`/app/organizations/${organization.id}/events`} className={cn(styles.card)}>
          <div className={cn(styles.content)}>
            <Text className={cn(styles.title)}>{organization.name}</Text>
            <Text className={cn(styles.date)}>
              Created {new Date(organization.created_at).toLocaleDateString()}
            </Text>
          </div>

          {(canEdit || isOwner) && (
            <Group gap={8} className={cn(styles.actions)}>
              {canEdit && (
                <ActionIcon
                  variant='subtle'
                  color='gray'
                  onClick={handleEditClick}
                  className={cn(styles.actionButton)}
                  size='sm'
                >
                  <IconPencil size={16} />
                </ActionIcon>
              )}
              {isOwner && (
                <ActionIcon
                  variant='subtle'
                  color='red'
                  onClick={handleDeleteClick}
                  className={cn(styles.actionButton)}
                  size='sm'
                >
                  <IconTrash size={16} />
                </ActionIcon>
              )}
            </Group>
          )}
        </Link>
      </div>

      <OrganizationModal
        organization={{
          id: organization.id,
          name: organization.name,
          created_at: organization.created_at,
          updated_at: organization.updated_at ?? organization.created_at,
          users: (organization.users ?? []) as OrganizationType['users'],
        }}
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => setShowEditModal(false)}
      />

      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title='Delete Organization'
        size='sm'
        lockScroll={false}
      >
        <Text size='sm' mb='lg'>
          Are you sure you want to delete this organization? This action cannot be undone.
        </Text>
        <Group justify='flex-end'>
          <Button variant='default' onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button color='red' onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
};
