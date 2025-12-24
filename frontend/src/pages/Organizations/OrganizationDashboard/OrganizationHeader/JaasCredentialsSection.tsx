import { useState, useEffect, type ChangeEvent } from 'react';
import {
  TextInput,
  Textarea,
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
  useUpdateJaasCredentialsMutation,
  useDeleteJaasCredentialsMutation,
} from '@/app/features/organizations/api';
import { notifications } from '@mantine/notifications';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { OrganizationUserRole, ApiError } from '@/types';

type Organization = {
  id: number;
  has_jaas_credentials?: boolean;
};

type JaasCredentialsSectionProps = {
  organization: Organization;
  currentUserRole: OrganizationUserRole;
};

type DirtyFields = {
  appId: boolean;
  apiKey: boolean;
  privateKey: boolean;
};

const JaasCredentialsSection = ({ organization, currentUserRole }: JaasCredentialsSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [appId, setAppId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [dirtyFields, setDirtyFields] = useState<DirtyFields>({
    appId: false,
    apiKey: false,
    privateKey: false,
  });

  const [updateJaasCredentials, { isLoading: isUpdating }] = useUpdateJaasCredentialsMutation();
  const [deleteJaasCredentials, { isLoading: isDeleting }] = useDeleteJaasCredentialsMutation();

  const canEdit = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const hasCredentials = organization.has_jaas_credentials;

  useEffect(() => {
    if (isEditing && hasCredentials) {
      setAppId('');
      setApiKey('');
      setPrivateKey('');
      setDirtyFields({ appId: false, apiKey: false, privateKey: false });
    } else {
      setAppId('');
      setApiKey('');
      setPrivateKey('');
      setDirtyFields({ appId: false, apiKey: false, privateKey: false });
    }
  }, [isEditing, hasCredentials]);

  const handleAppIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAppId(e.target.value);
    setDirtyFields((prev) => ({ ...prev, appId: true }));
  };

  const handleApiKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setDirtyFields((prev) => ({ ...prev, apiKey: true }));
  };

  const handlePrivateKeyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrivateKey(e.target.value);
    setDirtyFields((prev) => ({ ...prev, privateKey: true }));
  };

  const handleSave = async () => {
    if (dirtyFields.appId || dirtyFields.apiKey || dirtyFields.privateKey) {
      if (!appId.trim() || !apiKey.trim() || !privateKey.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'All three JaaS credential fields are required',
          color: 'red',
        });
        return;
      }
    }

    if (!dirtyFields.appId && !dirtyFields.apiKey && !dirtyFields.privateKey) {
      setIsEditing(false);
      return;
    }

    try {
      await updateJaasCredentials({
        orgId: organization.id,
        jaas_app_id: appId.trim(),
        jaas_api_key: apiKey.trim(),
        jaas_private_key: privateKey.trim(),
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'JaaS credentials updated',
        color: 'green',
      });

      setIsEditing(false);
      setAppId('');
      setApiKey('');
      setPrivateKey('');
      setDirtyFields({ appId: false, apiKey: false, privateKey: false });
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error?.data?.message || 'Failed to update JaaS credentials',
        color: 'red',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove JaaS credentials?')) {
      return;
    }

    try {
      await deleteJaasCredentials(organization.id).unwrap();

      notifications.show({
        title: 'Success',
        message: 'JaaS credentials removed',
        color: 'green',
      });

      setIsEditing(false);
      setAppId('');
      setApiKey('');
      setPrivateKey('');
      setDirtyFields({ appId: false, apiKey: false, privateKey: false });
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error?.data?.message || 'Failed to remove JaaS credentials',
        color: 'red',
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAppId('');
    setApiKey('');
    setPrivateKey('');
    setDirtyFields({ appId: false, apiKey: false, privateKey: false });
  };

  return (
    <Paper className={cn(styles.settingsCard)} withBorder>
      <Stack gap='md'>
        <Group justify='space-between' align='center'>
          <Group gap='sm'>
            <div className={cn(styles.settingsIcon)}>
              <IconKey size={20} stroke={1.5} />
            </div>
            <Text className={cn(styles.settingLabel)}>Jitsi Video Conferencing (JaaS)</Text>
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
            JaaS enables Jitsi video conferencing in sessions
          </Text>
        )}

        <Collapse in={isEditing && canEdit}>
          <Stack gap='sm'>
            <Alert icon={<IconAlertCircle size={16} />} color='blue' variant='light'>
              <Text size='xs' style={{ color: '#64748B' }}>
                Credentials are encrypted and never exposed. All three fields are required.
              </Text>
            </Alert>

            <TextInput
              label='JaaS App ID'
              placeholder={
                hasCredentials ? 'vpaas-magic-cookie-******' : 'vpaas-magic-cookie-xxxxx'
              }
              value={appId}
              onChange={handleAppIdChange}
              required
              description='Format: vpaas-magic-cookie-xxxxx...'
            />

            <TextInput
              label='JaaS API Key'
              placeholder={hasCredentials ? '********' : 'Enter API Key ID'}
              value={apiKey}
              onChange={handleApiKeyChange}
              required
              type='password'
              description='API Key ID for JWT header (kid)'
            />

            <Textarea
              label='JaaS Private Key (PEM format)'
              placeholder={hasCredentials ? '********' : '-----BEGIN PRIVATE KEY-----...'}
              value={privateKey}
              onChange={handlePrivateKeyChange}
              required
              minRows={4}
              description='Paste the complete RSA private key in PEM format'
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

export default JaasCredentialsSection;
