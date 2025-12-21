import { useState, useEffect, type ChangeEvent } from 'react';
import {
  TextInput,
  Group,
  Stack,
  Text,
  Badge,
  Alert,
  ActionIcon,
  Collapse,
  Paper,
} from '@mantine/core';
import {
  IconKey,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconShieldCheck,
  IconShieldX,
} from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons/Button';
import {
  useUpdateMuxCredentialsMutation,
  useDeleteMuxCredentialsMutation,
} from '@/app/features/organizations/api';
import { notifications } from '@mantine/notifications';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { OrganizationUserRole, ApiError } from '@/types';

type Organization = {
  id: number;
  has_mux_signing_credentials?: boolean;
};

type MuxCredentialsSectionProps = {
  organization: Organization;
  currentUserRole: OrganizationUserRole;
};

type DirtyFields = {
  keyId: boolean;
  privateKey: boolean;
};

const MuxCredentialsSection = ({ organization, currentUserRole }: MuxCredentialsSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [keyId, setKeyId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [dirtyFields, setDirtyFields] = useState<DirtyFields>({ keyId: false, privateKey: false });

  const [updateMuxCredentials, { isLoading: isUpdating }] = useUpdateMuxCredentialsMutation();
  const [deleteMuxCredentials, { isLoading: isDeleting }] = useDeleteMuxCredentialsMutation();

  const canEdit = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const hasCredentials = organization.has_mux_signing_credentials;

  useEffect(() => {
    if (isEditing && hasCredentials) {
      setKeyId('');
      setPrivateKey('');
      setDirtyFields({ keyId: false, privateKey: false });
    } else {
      setKeyId('');
      setPrivateKey('');
      setDirtyFields({ keyId: false, privateKey: false });
    }
  }, [isEditing, hasCredentials]);

  const handleKeyIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setKeyId(e.target.value);
    setDirtyFields((prev) => ({ ...prev, keyId: true }));
  };

  const handlePrivateKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPrivateKey(e.target.value);
    setDirtyFields((prev) => ({ ...prev, privateKey: true }));
  };

  const handleSave = async () => {
    if (dirtyFields.keyId || dirtyFields.privateKey) {
      if (!keyId.trim() || !privateKey.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Both Signing Key ID and Private Key are required',
          color: 'red',
        });
        return;
      }
    }

    if (!dirtyFields.keyId && !dirtyFields.privateKey) {
      setIsEditing(false);
      return;
    }

    try {
      await updateMuxCredentials({
        orgId: organization.id,
        mux_signing_key_id: keyId.trim(),
        mux_signing_private_key: privateKey.trim(),
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Mux signing credentials updated',
        color: 'green',
      });

      setIsEditing(false);
      setKeyId('');
      setPrivateKey('');
      setDirtyFields({ keyId: false, privateKey: false });
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error?.data?.message || 'Failed to update Mux credentials',
        color: 'red',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove Mux signing credentials?')) {
      return;
    }

    try {
      await deleteMuxCredentials(organization.id).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Mux signing credentials removed',
        color: 'green',
      });

      setIsEditing(false);
      setKeyId('');
      setPrivateKey('');
      setDirtyFields({ keyId: false, privateKey: false });
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error?.data?.message || 'Failed to remove Mux credentials',
        color: 'red',
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setKeyId('');
    setPrivateKey('');
    setDirtyFields({ keyId: false, privateKey: false });
  };

  return (
    <Paper className={cn(styles.settingsCard)} withBorder>
      <Stack gap='md'>
        <Group justify='space-between' align='center'>
          <Group gap='sm'>
            <div className={cn(styles.settingsIcon)}>
              <IconKey size={20} stroke={1.5} />
            </div>
            <Text className={cn(styles.settingLabel)}>Mux Video Signing</Text>
            {hasCredentials ?
              <Badge
                leftSection={<IconShieldCheck size={14} />}
                color='green'
                variant='light'
                size='sm'
              >
                Enabled
              </Badge>
            : <Badge leftSection={<IconShieldX size={14} />} color='gray' variant='light' size='sm'>
                Disabled
              </Badge>
            }
          </Group>

          {canEdit && !isEditing && (
            <Button variant='secondary' onClick={() => setIsEditing(true)}>
              <IconKey size={16} />
              {hasCredentials ? 'Update Credentials' : 'Add Credentials'}
            </Button>
          )}

          {canEdit && isEditing && (
            <ActionIcon
              variant='subtle'
              onClick={handleCancel}
              disabled={isUpdating || isDeleting}
              size='lg'
              className={cn(styles.cancelButton)}
            >
              <IconX size={18} />
            </ActionIcon>
          )}
        </Group>

        {!canEdit && (
          <Text size='xs' c='dimmed' className={cn(styles.settingHint)}>
            Mux signing protects video streams with JWT authentication
          </Text>
        )}

        <Collapse in={isEditing && canEdit}>
          <Stack gap='sm'>
            <Alert icon={<IconAlertCircle size={16} />} color='blue' variant='light'>
              <Text size='xs' style={{ color: '#64748B' }}>
                Credentials are encrypted and never exposed. Enter new values to update.
              </Text>
            </Alert>

            <TextInput
              label='Mux Signing Key ID'
              placeholder={hasCredentials ? 'sk_******' : 'Enter signing key ID'}
              value={keyId}
              onChange={handleKeyIdChange}
              required
              description={
                hasCredentials && !dirtyFields.keyId ?
                  'Leave empty to keep existing value'
                : 'Format: sk_xxxxx...'
              }
            />

            <TextInput
              label='Mux Private Key (Base64)'
              placeholder={hasCredentials ? '********' : 'Enter private key'}
              value={privateKey}
              onChange={handlePrivateKeyChange}
              required
              type='password'
              description={
                hasCredentials && !dirtyFields.privateKey ?
                  'Leave empty to keep existing value'
                : 'Paste the complete base64-encoded private key'
              }
            />

            <div>
              <Button
                variant='primary'
                onClick={handleSave}
                disabled={isUpdating || isDeleting}
                loading={isUpdating}
              >
                <IconCheck size={16} />
                Save Credentials
              </Button>
            </div>

            {hasCredentials && (
              <div>
                <Button
                  variant='danger'
                  onClick={handleDelete}
                  disabled={isUpdating || isDeleting}
                  loading={isDeleting}
                >
                  Remove Credentials
                </Button>
              </div>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
};

export default MuxCredentialsSection;
