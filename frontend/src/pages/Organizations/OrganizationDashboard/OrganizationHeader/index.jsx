import { useState } from 'react';
import { TextInput, Group, Badge, ActionIcon, Text } from '@mantine/core';
import { IconEdit, IconCheck, IconX, IconSettings, IconBuilding, IconUsers } from '@tabler/icons-react';
import { useUpdateOrganizationMutation } from '../../../../app/features/organizations/api';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../shared/components/buttons';
import styles from './styles/index.module.css';

const OrganizationHeader = ({ organization, currentUserRole }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(organization.name);
  const [updateOrganization, { isLoading }] = useUpdateOrganizationMutation();

  const canEdit = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canViewSettings = currentUserRole === 'OWNER';

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
    } catch (error) {
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
              <Group spacing="xs" align="center">
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
              </Group>
            ) : (
              <Group spacing="sm" align="center">
                <h1 className={styles.organizationName}>{organization.name}</h1>
                {canEdit && (
                  <ActionIcon
                    variant="subtle"
                    onClick={() => setIsEditing(true)}
                    className={styles.editButton}
                  >
                    <IconEdit size={20} />
                  </ActionIcon>
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
                {organization.member_count || 0} member{organization.member_count !== 1 ? 's' : ''}
              </Badge>
              
              <Badge
                variant="outline"
                color={currentUserRole === 'OWNER' ? 'violet' : currentUserRole === 'ADMIN' ? 'pink' : 'blue'}
                size="lg"
                className={styles.roleBadge}
              >
                {currentUserRole}
              </Badge>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {canViewSettings && (
            <Button
              variant="subtle"
              leftIcon={<IconSettings size={18} />}
              onClick={() => navigate(`/app/organizations/${organization.id}/settings`)}
            >
              Settings
            </Button>
          )}
          
          <Button
            variant="primary"
            onClick={() => navigate(`/app/organizations/${organization.id}/events`)}
          >
            View Events
          </Button>
        </div>
      </div>

      {organization.description && (
        <Text className={styles.description} size="sm" color="dimmed">
          {organization.description}
        </Text>
      )}
    </section>
  );
};

export default OrganizationHeader;