import { useState } from 'react';
import { TextInput, Group, Badge, ActionIcon, Text } from '@mantine/core';
import {
  IconEdit,
  IconCheck,
  IconX,
  IconBuilding,
  IconUsers,
} from '@tabler/icons-react';
import { useUpdateOrganizationMutation } from '../../../../app/features/organizations/api';
import { notifications } from '@mantine/notifications';
// import { useNavigate } from 'react-router-dom'; // TODO: Implement settings button
import styles from './styles/index.module.css';

const OrganizationHeader = ({ organization, currentUserRole }) => {
  // const navigate = useNavigate(); // TODO: Implement settings button
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(organization.name);
  const [updateOrganization, { isLoading }] = useUpdateOrganizationMutation();

  const canEdit = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  // const canViewSettings = currentUserRole === 'OWNER'; // TODO: Implement settings button

  const handleSave = async () => {
    if (editedName.trim() === organization.name) {
      setIsEditing(false);
      return;
    }

    try {
      await updateOrganization({
        id: organization.id,
        name: editedName.trim(),
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Organization name updated',
        color: 'green',
      });
      setIsEditing(false);
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update organization name',
        color: 'red',
      });
      setEditedName(organization.name);
    }
  };

  const handleCancel = () => {
    setEditedName(organization.name);
    setIsEditing(false);
  };

  return (
    <section className={styles.headerSection}>
      <div className={styles.headerContent}>
        <div className={styles.organizationInfo}>
          <div className={styles.iconWrapper}>
            <IconBuilding size={48} stroke={1.5} />
          </div>

          <div className={styles.titleArea}>
            {isEditing ? (
              <div className={styles.editingContainer}>
                <TextInput
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className={styles.nameInput}
                  size="lg"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
                <div className={styles.editButtons}>
                  <ActionIcon
                    variant="filled"
                    color="green"
                    onClick={handleSave}
                    disabled={isLoading}
                    size="lg"
                    className={styles.saveButton}
                  >
                    <IconCheck size={20} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    onClick={handleCancel}
                    disabled={isLoading}
                    size="lg"
                    className={styles.cancelButton}
                  >
                    <IconX size={20} />
                  </ActionIcon>
                </div>
              </div>
            ) : (
              <Group spacing="sm" align="center">
                <h1 className={styles.organizationName}>{organization.name}</h1>
                {canEdit && (
                  <div
                    className={styles.editContainer}
                    onClick={() => setIsEditing(true)}
                  >
                    <IconEdit size={16} />
                    <Text size="sm" className={styles.editText}>
                      Edit Organization Name
                    </Text>
                  </div>
                )}
              </Group>
            )}

            <div className={styles.metadata}>
              <Badge
                leftSection={<IconUsers size={14} />}
                variant="light"
                color="violet"
                size="lg"
                className={styles.memberBadge}
              >
                {organization.member_count || 0} member
                {organization.member_count !== 1 ? 's' : ''}
              </Badge>

              <Badge
                variant="outline"
                color={
                  currentUserRole === 'OWNER'
                    ? 'violet'
                    : currentUserRole === 'ADMIN'
                      ? 'pink'
                      : 'blue'
                }
                size="lg"
                className={styles.roleBadge}
              >
                {currentUserRole}
              </Badge>
            </div>
          </div>
        </div>

        {/* Settings button - commented out for now, will add later */}
        {/* <div className={styles.headerActions}>
          {canViewSettings && (
            <ActionIcon
              size="lg"
              variant="subtle"
              onClick={() => navigate(`/app/organizations/${organization.id}/settings`)}
              className={styles.settingsButton}
              title="Organization Settings"
            >
              <IconSettings size={22} />
            </ActionIcon>
          )}
        </div> */}
      </div>

      {organization.description && (
        <Text className={styles.description} size="sm" c="dimmed">
          {organization.description}
        </Text>
      )}
    </section>
  );
};

export default OrganizationHeader;
