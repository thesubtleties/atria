import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Stack, Title, Text, Divider, Group, Center, Tabs } from '@mantine/core';
import { LoadingContent } from '@/shared/components/loading';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconWorld, IconCalendarEvent } from '@tabler/icons-react';
import {
  useGetUserPrivacySettingsQuery,
  useUpdateUserPrivacySettingsMutation,
} from '@/app/features/users/api';
import { Button } from '@/shared/components/buttons';
import { privacySettingsSchema } from '../../schemas/privacySchema';
import type { PrivacySettingsFormData } from '../../schemas/privacySchema';
import EmailSection from './EmailSection';
import ConnectionSection from './ConnectionSection';
import ProfileSection from './ProfileSection';
import EventOverrides from './EventOverrides';
import type { RootState, ApiError } from '@/types';
import { cn } from '@/lib/cn';
import styles from './styles.module.css';

const PrivacySettings = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState<PrivacySettingsFormData | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('global');

  // Fetch privacy settings
  const { data: privacyData, isLoading } = useGetUserPrivacySettingsQuery(
    currentUser?.id as number,
    {
      skip: !currentUser?.id,
    },
  );

  // Update mutation
  const [updatePrivacySettings, { isLoading: isUpdating }] = useUpdateUserPrivacySettingsMutation();

  // Form setup
  const form = useForm<PrivacySettingsFormData>({
    initialValues: {
      email_visibility: 'CONNECTIONS_ORGANIZERS',
      show_public_email: false,
      public_email: '',
      allow_connection_requests: 'EVENT_ATTENDEES',
      show_social_links: 'EVENT_ATTENDEES',
      show_company: true,
      show_bio: true,
    },
    validate: zodResolver(privacySettingsSchema),
  });

  // Update form when data loads
  useEffect(() => {
    if (privacyData?.privacy_settings) {
      const settings = privacyData.privacy_settings as PrivacySettingsFormData;
      form.setValues(settings);
      setOriginalValues(settings);
    }
    // IMPORTANT: DO NOT add 'form' to dependencies - it causes infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privacyData]);

  // Track changes
  useEffect(() => {
    if (originalValues) {
      const changed = Object.keys(form.values).some((key) => {
        const k = key as keyof PrivacySettingsFormData;
        return form.values[k] !== originalValues[k];
      });
      setHasChanges(changed);
    }
  }, [form.values, originalValues]);

  const handleSubmit = async (values: PrivacySettingsFormData) => {
    if (!currentUser) return;
    try {
      await updatePrivacySettings({
        id: currentUser.id,
        ...values,
        public_email: values.public_email ?? null,
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
    } catch (err) {
      const error = err as ApiError;
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
        <LoadingContent message='Loading privacy settings...' size='lg' />
      </Center>
    );
  }

  return (
    <Stack gap='lg'>
      <div className={cn(styles.headerSection)}>
        <Title order={3} className={cn(styles.sectionTitle)}>
          Privacy Settings
        </Title>
        <Text size='sm' className={cn(styles.description)}>
          Control who can see your information and contact you
        </Text>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} className={cn(styles.privacyTabs)}>
        <Tabs.List>
          <Tabs.Tab value='global' leftSection={<IconWorld size={16} />}>
            Global Privacy
          </Tabs.Tab>
          <Tabs.Tab value='events' leftSection={<IconCalendarEvent size={16} />}>
            Event Privacy
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='global' pt='xl'>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap='lg'>
              <EmailSection form={form} />

              <Divider className={cn(styles.divider)} />

              <ConnectionSection form={form} />

              <Divider className={cn(styles.divider)} />

              <ProfileSection form={form} />

              {hasChanges && (
                <Group justify='flex-end' mt='md' className={cn(styles.buttonGroup)}>
                  <Button variant='secondary' onClick={handleReset} disabled={isUpdating}>
                    <IconX size={16} />
                    Cancel
                  </Button>
                  <Button variant='primary' type='submit' loading={isUpdating}>
                    <IconCheck size={16} />
                    Save Changes
                  </Button>
                </Group>
              )}
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value='events' pt='xl'>
          <EventOverrides />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default PrivacySettings;
