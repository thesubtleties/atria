import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Stack,
  Title,
  Text,
  Divider,
  Group,
  Loader,
  Center,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import {
  useGetUserPrivacySettingsQuery,
  useUpdateUserPrivacySettingsMutation,
} from '@/app/features/users/api';
import { Button } from '../../../../shared/components/buttons';
import { privacySettingsSchema } from '../../schemas/privacySchema';
import EmailSection from './EmailSection';
import ConnectionSection from './ConnectionSection';
import ProfileSection from './ProfileSection';
import EventOverrides from './EventOverrides';
import styles from './styles.module.css';

const PrivacySettings = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState(null);
  
  // Fetch privacy settings
  const { data: privacyData, isLoading } = useGetUserPrivacySettingsQuery(
    currentUser?.id,
    { skip: !currentUser?.id }
  );
  
  // Update mutation
  const [updatePrivacySettings, { isLoading: isUpdating }] = useUpdateUserPrivacySettingsMutation();
  
  // Form setup
  const form = useForm({
    initialValues: {
      email_visibility: 'connections_organizers',
      show_public_email: false,
      public_email: '',
      allow_connection_requests: 'everyone',
      show_social_links: 'everyone',
      show_company: true,
      show_bio: true,
    },
    validate: zodResolver(privacySettingsSchema),
  });
  
  // Update form when data loads
  useEffect(() => {
    if (privacyData?.privacy_settings) {
      form.setValues(privacyData.privacy_settings);
      setOriginalValues(privacyData.privacy_settings);
    }
  }, [privacyData]);
  
  // Track changes
  useEffect(() => {
    if (originalValues) {
      const changed = Object.keys(form.values).some(key => {
        return form.values[key] !== originalValues[key];
      });
      setHasChanges(changed);
    }
  }, [form.values, originalValues]);
  
  const handleSubmit = async (values) => {
    try {
      await updatePrivacySettings({
        id: currentUser.id,
        ...values,
      }).unwrap();
      
      // Update original values after successful save
      setOriginalValues(values);
      setHasChanges(false);
      
      notifications.show({
        title: 'Success',
        message: 'Privacy settings updated successfully',
        color: 'green',
        icon: <IconCheck />,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update privacy settings',
        color: 'red',
      });
    }
  };
  
  const handleReset = () => {
    if (originalValues) {
      form.setValues(originalValues);
      setHasChanges(false);
    }
  };
  
  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }
  
  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="lg">
        <div className={styles.headerSection}>
          <Title order={3} className={styles.sectionTitle}>Privacy Settings</Title>
          <Text size="sm" className={styles.description}>
            Control who can see your information and contact you
          </Text>
        </div>
        
        <Divider className={styles.divider} />
        
        <EmailSection form={form} />
        
        <Divider className={styles.divider} />
        
        <ConnectionSection form={form} />
        
        <Divider className={styles.divider} />
        
        <ProfileSection form={form} />
        
        {privacyData?.event_overrides?.length > 0 && (
          <>
            <Divider className={styles.divider} />
            <EventOverrides overrides={privacyData.event_overrides} />
          </>
        )}
        
        {hasChanges && (
          <Group justify="flex-end" mt="md" className={styles.buttonGroup}>
            <Button
              variant="subtle"
              onClick={handleReset}
              disabled={isUpdating}
            >
              <IconX size={16} />
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={isUpdating}
            >
              <IconCheck size={16} />
              Save Changes
            </Button>
          </Group>
        )}
      </Stack>
    </form>
  );
};

export default PrivacySettings;