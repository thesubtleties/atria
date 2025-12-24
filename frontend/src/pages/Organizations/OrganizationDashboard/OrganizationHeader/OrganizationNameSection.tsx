import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { TextInput, Group, Stack, Text, ActionIcon, Collapse, Paper } from '@mantine/core';
import { IconBuilding, IconCheck, IconX } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons/Button';
import { useUpdateOrganizationMutation } from '@/app/features/organizations/api';
import { notifications } from '@mantine/notifications';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { OrganizationUserRole, ApiError } from '@/types';

type Organization = {
  id: number;
  name: string;
};

type OrganizationNameSectionProps = {
  organization: Organization;
  currentUserRole: OrganizationUserRole;
};

const OrganizationNameSection = ({
  organization,
  currentUserRole,
}: OrganizationNameSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(organization.name);
  const [updateOrganization, { isLoading }] = useUpdateOrganizationMutation();

  const canEdit = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  useEffect(() => {
    setEditedName(organization.name);
  }, [organization.name]);

  const handleSave = async () => {
    const trimmedName = editedName.trim();

    if (!trimmedName) {
      notifications.show({
        title: 'Validation Error',
        message: 'Organization name cannot be empty',
        color: 'red',
      });
      return;
    }

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
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error?.data?.message || 'Failed to update organization name',
        color: 'red',
      });
      setEditedName(organization.name);
    }
  };

  const handleCancel = () => {
    setEditedName(organization.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <Paper className={cn(styles.settingsCard)} withBorder>
      <Stack gap='md'>
        <Group justify='space-between' align='center'>
          <Group gap='sm'>
            <div className={cn(styles.settingsIcon)}>
              <IconBuilding size={20} stroke={1.5} />
            </div>
            <div>
              <Text className={cn(styles.settingLabel)}>Organization Name</Text>
              {!isEditing && <Text className={cn(styles.settingValue)}>{organization.name}</Text>}
            </div>
          </Group>

          {canEdit && !isEditing && (
            <Button variant='secondary' onClick={() => setIsEditing(true)}>
              <IconBuilding size={16} />
              Edit Name
            </Button>
          )}

          {canEdit && isEditing && (
            <ActionIcon
              variant='subtle'
              onClick={handleCancel}
              disabled={isLoading}
              size='lg'
              className={cn(styles.cancelButton)}
            >
              <IconX size={18} />
            </ActionIcon>
          )}
        </Group>

        {!canEdit && (
          <Text size='xs' c='dimmed' className={cn(styles.settingHint)}>
            Only organization admins and owners can change the name
          </Text>
        )}

        <Collapse in={isEditing && canEdit}>
          <Stack gap='sm'>
            <TextInput
              label='Organization Name'
              placeholder='Enter organization name'
              value={editedName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEditedName(e.target.value)}
              required
              autoFocus
              onKeyDown={handleKeyDown}
            />

            <div>
              <Button
                variant='primary'
                onClick={handleSave}
                disabled={isLoading}
                loading={isLoading}
              >
                <IconCheck size={16} />
                Save Name
              </Button>
            </div>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
};

export default OrganizationNameSection;
