// pages/Organizations/OrganizationsList/OrganizationCard/index.jsx
import { Text, ActionIcon, Group, Modal, Button } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { OrganizationModal } from '@/shared/components/modals/organization/OrganizationModal';
import { useDeleteOrganizationMutation } from '@/app/features/organizations/api';
import styles from './styles/index.module.css';

export const OrganizationCard = ({ organization }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const currentUserId = useSelector((state) => state.auth.user?.id);
  const [deleteOrganization] = useDeleteOrganizationMutation();

  const canEdit = organization.users?.some(
    (user) =>
      user.id === currentUserId && ['OWNER', 'ADMIN'].includes(user.role)
  );

  const isOwner = organization.users?.some(
    (user) => user.id === currentUserId && user.role === 'OWNER'
  );

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleDeleteClick = (e) => {
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
      <div className={styles.cardWrapper}>
        <Link
          to={`/app/organizations/${organization.id}/events`}
          className={styles.card}
        >
          <div className={styles.content}>
            <Text className={styles.title}>{organization.name}</Text>
            <Text className={styles.date}>
              Created {new Date(organization.created_at).toLocaleDateString()}
            </Text>
          </div>

          {(canEdit || isOwner) && (
            <Group spacing={8} className={styles.actions}>
              {canEdit && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={handleEditClick}
                  className={styles.actionButton}
                  size="sm"
                >
                  <IconPencil size={16} />
                </ActionIcon>
              )}
              {isOwner && (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={handleDeleteClick}
                  className={styles.actionButton}
                  size="sm"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              )}
            </Group>
          )}
        </Link>
      </div>

      <OrganizationModal
        organization={organization}
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => setShowEditModal(false)}
      />

      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Organization"
        size="sm"
        lockScroll={false}
      >
        <Text size="sm" mb="lg">
          Are you sure you want to delete this organization? This action cannot
          be undone.
        </Text>
        <Group position="right">
          <Button variant="default" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
};
