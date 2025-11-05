import { useState, useEffect } from 'react';
import {
  TextInput,
  Group,
  Stack,
  Text,
  ActionIcon,
  Collapse,
  Paper,
} from '@mantine/core';
import {
  IconBuilding,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { Button } from '../../../../shared/components/buttons/Button';
import { useUpdateOrganizationMutation } from '../../../../app/features/organizations/api';
import { notifications } from '@mantine/notifications';
import styles from './styles/index.module.css';

/**
 * OrganizationNameSection - Manages organization name editing
 *
 * Features:
 * - Shows current organization name
 * - ADMIN/OWNER can edit name
 * - Proper RTK Query cache invalidation
 */
const OrganizationNameSection = ({ organization, currentUserRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(organization.name);
  const [updateOrganization, { isLoading }] = useUpdateOrganizationMutation();

  const canEdit = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  // Reset form when organization changes
  useEffect(() => {
    setEditedName(organization.name);
  }, [organization.name]);

  const handleSave = async () => {
    const trimmedName = editedName.trim();

    // Validation
    if (!trimmedName) {
      notifications.show({
        title: 'Validation Error',
        message: 'Organization name cannot be empty',
        color: 'red',
      });
      return;
    }

    // No change
    if (trimmedName === organization.name) {
      setIsEditing(false);
      return;
    }

    try {
      await updateOrganization({
        id: organization.id,
        name: trimmedName,
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
        message: error?.data?.message || 'Failed to update organization name',
        color: 'red',
      });
      // Reset to original name on error
      setEditedName(organization.name);
    }
  };

  const handleCancel = () => {
    setEditedName(organization.name);
    setIsEditing(false);
  };

  return (
    <Paper className={styles.settingsCard} withBorder>
      <Stack spacing="md">
        {/* Header with current name */}
        <Group position="apart" align="center">
          <Group spacing="sm">
            <div className={styles.settingsIcon}>
              <IconBuilding size={20} stroke={1.5} />
            </div>
            <div>
              <Text className={styles.settingLabel}>Organization Name</Text>
              {!isEditing && (
                <Text className={styles.settingValue}>{organization.name}</Text>
              )}
            </div>
          </Group>

          {canEdit && !isEditing && (
            <Button variant="subtle" onClick={() => setIsEditing(true)}>
              <IconBuilding size={16} />
              Edit Name
            </Button>
          )}
        </Group>

        {/* Info text for non-editors */}
        {!canEdit && (
          <Text size="xs" c="dimmed" className={styles.settingHint}>
            Only organization admins and owners can change the name
          </Text>
        )}

        {/* Editing form (ADMIN/OWNER only) */}
        <Collapse in={isEditing && canEdit}>
          <Stack spacing="sm">
            <TextInput
              label="Organization Name"
              placeholder="Enter organization name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              required
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />

            <Group spacing="xs">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isLoading}
                loading={isLoading}
              >
                <IconCheck size={16} />
                Save Name
              </Button>
              <ActionIcon
                variant="subtle"
                onClick={handleCancel}
                disabled={isLoading}
                size="lg"
              >
                <IconX size={18} />
              </ActionIcon>
            </Group>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
};

export default OrganizationNameSection;
