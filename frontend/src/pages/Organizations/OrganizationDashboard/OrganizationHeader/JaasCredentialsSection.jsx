import { useState, useEffect } from 'react';
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
import { Button } from '../../../../shared/components/buttons/Button';
import {
  useUpdateJaasCredentialsMutation,
  useDeleteJaasCredentialsMutation,
} from '../../../../app/features/organizations/api';
import { notifications } from '@mantine/notifications';
import styles from './styles/index.module.css';

/**
 * JaasCredentialsSection - Manages JaaS (Jitsi as a Service) credentials for organization
 *
 * Features:
 * - Shows credential status to all org members
 * - ADMIN/OWNER can edit credentials
 * - Masked credential display (never exposes real keys)
 * - All three fields required together
 */
const JaasCredentialsSection = ({ organization, currentUserRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [appId, setAppId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [dirtyFields, setDirtyFields] = useState({
    appId: false,
    apiKey: false,
    privateKey: false,
  });

  const [updateJaasCredentials, { isLoading: isUpdating }] = useUpdateJaasCredentialsMutation();
  const [deleteJaasCredentials, { isLoading: isDeleting }] = useDeleteJaasCredentialsMutation();

  const canEdit = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const hasCredentials = organization.has_jaas_credentials;

  // Reset form when switching edit mode
  useEffect(() => {
    if (isEditing && hasCredentials) {
      // Show empty fields - user must type new values
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

  const handleAppIdChange = (e) => {
    setAppId(e.target.value);
    setDirtyFields((prev) => ({ ...prev, appId: true }));
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    setDirtyFields((prev) => ({ ...prev, apiKey: true }));
  };

  const handlePrivateKeyChange = (e) => {
    setPrivateKey(e.target.value);
    setDirtyFields((prev) => ({ ...prev, privateKey: true }));
  };

  const handleSave = async () => {
    // Validate: All three fields must be provided together
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

    // If nothing changed, just close edit mode
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
    } catch (error) {
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
    } catch (error) {
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
    <Paper className={styles.settingsCard} withBorder>
      <Stack spacing='md'>
        {/* Header with status */}
        <Group position='apart' align='center'>
          <Group spacing='sm'>
            <div className={styles.settingsIcon}>
              <IconKey size={20} stroke={1.5} />
            </div>
            <Text className={styles.settingLabel}>Jitsi Video Conferencing (JaaS)</Text>
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
            <Button variant='subtle' onClick={() => setIsEditing(true)}>
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
              className={styles.cancelButton}
            >
              <IconX size={18} />
            </ActionIcon>
          )}
        </Group>

        {/* Info text for non-editors */}
        {!canEdit && (
          <Text size='xs' c='dimmed' className={styles.settingHint}>
            JaaS enables Jitsi video conferencing in sessions
          </Text>
        )}

        {/* Editing form (ADMIN/OWNER only) */}
        <Collapse in={isEditing && canEdit}>
          <Stack spacing='sm'>
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

            {/* Action buttons */}
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

            {/* Remove button below save if credentials exist */}
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
