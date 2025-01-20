// pages/Organizations/OrganizationsList/OrganizationCard/index.jsx
import { Text, ActionIcon } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { OrganizationModal } from '@/shared/components/modals/organization/OrganizationModal';
import styles from './styles/index.module.css';

export const OrganizationCard = ({ organization }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const currentUserId = useSelector((state) => state.auth.user?.id);

  const canEdit = organization.users?.some(
    (user) =>
      user.id === currentUserId && ['OWNER', 'ADMIN'].includes(user.role)
  );

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditModal(true);
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
        </Link>
      </div>

      <OrganizationModal
        organization={organization}
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => setShowEditModal(false)}
      />
    </>
  );
};
