import { useState, useEffect, type ChangeEvent } from 'react';
import { Alert, Text, Group, Select, Switch, Stack, Card, Divider, Center } from '@mantine/core';
import { LoadingSpinner } from '@/shared/components/loading';
import { IconAlertCircle, IconCalendarEvent } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  useGetUserEventsQuery,
  useGetEventPrivacyOverridesQuery,
  useUpdateEventPrivacyOverridesMutation,
  useDeleteEventPrivacyOverridesMutation,
} from '@/app/features/users/api';
import { eventPrivacyOverrideFormSchema } from '../../schemas/privacySchema';
import type { EventPrivacyOverrideFormData } from '../../schemas/privacySchema';
import EmailSection from './EmailSection';
import ConnectionSection from './ConnectionSection';
import ProfileSection from './ProfileSection';
import { Button } from '@/shared/components/buttons';
import type { RootState, ApiError } from '@/types';
import { cn } from '@/lib/cn';
import styles from './styles.module.css';

type PrivacyOverridesResponse = {
  privacy_overrides?: EventPrivacyOverrideFormData;
};

const EventOverrides = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState<EventPrivacyOverrideFormData | null>(null);

  // Fetch user's events
  const { data: eventsData, isLoading: eventsLoading } = useGetUserEventsQuery(
    {
      userId: currentUser?.id as number,
      page: 1,
      per_page: 100, // Get all events for dropdown
    },
    { skip: !currentUser?.id },
  );

  // Fetch privacy overrides for selected event
  const { data: overridesData, isLoading: overridesLoading } = useGetEventPrivacyOverridesQuery(
    { userId: currentUser?.id as number, eventId: selectedEventId as number },
    { skip: !currentUser?.id || !selectedEventId },
  );

  // Mutations
  const [updateOverrides, { isLoading: isUpdating }] = useUpdateEventPrivacyOverridesMutation();
  const [deleteOverrides, { isLoading: isDeleting }] = useDeleteEventPrivacyOverridesMutation();

  // Form for privacy settings
  const form = useForm<EventPrivacyOverrideFormData>({
    initialValues: {
      email_visibility: 'CONNECTIONS_ORGANIZERS',
      show_public_email: false,
      public_email: '',
      allow_connection_requests: 'EVENT_ATTENDEES',
      show_social_links: 'EVENT_ATTENDEES',
      show_company: true,
      show_bio: true,
    },
    validate: zodResolver(eventPrivacyOverrideFormSchema),
  });

  // Update form when overrides data loads
  useEffect(() => {
    if (!selectedEventId) return;

    const typedData = overridesData as PrivacyOverridesResponse | undefined;
    if (typedData?.privacy_overrides) {
      const hasOverrides = Object.keys(typedData.privacy_overrides).length > 0;
      setOverrideEnabled(hasOverrides);
      if (hasOverrides) {
        form.setValues(typedData.privacy_overrides);
        setOriginalValues(typedData.privacy_overrides);
      } else {
        // Empty overrides object means no overrides for this event
        setOverrideEnabled(false);
        form.reset();
        setOriginalValues(null);
      }
    } else if (overridesData) {
      // Response exists but no overrides
      setOverrideEnabled(false);
      form.reset();
      setOriginalValues(null);
    }
    // IMPORTANT: DO NOT add 'form' to dependencies - it causes infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overridesData, selectedEventId]);

  // Track changes
  useEffect(() => {
    if (overrideEnabled) {
      if (originalValues) {
        // Existing overrides - compare with original
        const changed = Object.keys(form.values).some((key) => {
          const k = key as keyof EventPrivacyOverrideFormData;
          return form.values[k] !== originalValues[k];
        });
        setHasChanges(changed);
      } else {
        // New overrides - always show save button
        setHasChanges(true);
      }
    } else {
      setHasChanges(false);
    }
  }, [form.values, originalValues, overrideEnabled]);

  // Event selection handler
  const handleEventSelect = (eventId: string | null) => {
    // Reset state when changing events
    setSelectedEventId(eventId ? parseInt(eventId) : null);
    setHasChanges(false);
    // Don't reset override state here - let it be determined by the data fetch
  };

  // Override toggle handler
  const handleOverrideToggle = async (checked: boolean) => {
    if (!checked && overrideEnabled && currentUser && selectedEventId) {
      // Delete overrides when disabling
      try {
        await deleteOverrides({
          userId: currentUser.id,
          eventId: selectedEventId,
        }).unwrap();

        notifications.show({
          title: 'Success',
          message: 'Event privacy overrides removed',
          color: 'green',
        });

        setOverrideEnabled(false);
        form.reset();
        setOriginalValues(null);
        setHasChanges(false);
      } catch {
        notifications.show({
          title: 'Error',
          message: 'Failed to remove privacy overrides',
          color: 'red',
        });
      }
    } else if (checked && !overrideEnabled) {
      // Enabling overrides for the first time
      setOverrideEnabled(true);
      // Set originalValues to null to trigger hasChanges = true
      setOriginalValues(null);
    }
  };

  // Save overrides
  const handleSubmit = async (values: EventPrivacyOverrideFormData) => {
    if (!currentUser || !selectedEventId) return;
    try {
      await updateOverrides({
        userId: currentUser.id,
        eventId: selectedEventId,
        ...values,
        public_email: values.public_email ?? null,
      }).unwrap();

      setOriginalValues(values);
      setHasChanges(false);

      notifications.show({
        title: 'Success',
        message: 'Event privacy overrides saved',
        color: 'green',
      });
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to save privacy overrides',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    if (originalValues) {
      form.setValues(originalValues);
    } else {
      // Reset to initial defaults when no original values
      form.reset();
    }
    setHasChanges(false);
  };

  // Prepare events for dropdown
  type EventItem = { id: number; title: string };
  const events = (eventsData?.items || []) as EventItem[];
  const eventOptions = events.map((event) => ({
    value: event.id.toString(),
    label: event.title,
  }));

  if (eventsLoading) {
    return (
      <Center h={200}>
        <LoadingSpinner size='lg' />
      </Center>
    );
  }

  if (!eventOptions.length) {
    return (
      <Alert icon={<IconAlertCircle />} variant='light' className={cn(styles.infoAlert)}>
        <Text fw={500} mb='xs' className={cn(styles.sectionLabel)}>
          No Events Available
        </Text>
        <Text size='sm' className={cn(styles.alertText)}>
          {
            "You're not currently part of any events. Event-specific privacy overrides will be available when you join or create events."
          }
        </Text>
      </Alert>
    );
  }

  return (
    <Stack gap='lg'>
      <Text size='sm' className={cn(styles.description)}>
        Customize your privacy settings for specific events. These settings will override your
        global privacy settings when participating in the selected event.
      </Text>

      <Select
        label='Select Event'
        placeholder='Choose an event to configure'
        data={eventOptions}
        value={selectedEventId?.toString() ?? null}
        onChange={handleEventSelect}
        leftSection={<IconCalendarEvent size={16} />}
        className={cn(styles.formInput)}
        description='Select an event to view or configure privacy overrides'
      />

      {selectedEventId && (
        <>
          <Card className={cn(styles.overrideCard)}>
            <Group justify='space-between' mb='md'>
              <div>
                <Text fw={500}>Override Privacy Settings for This Event</Text>
                <Text size='sm' c='dimmed'>
                  When enabled, these settings will override your global privacy settings for this
                  event only
                </Text>
              </div>
              <Switch
                checked={overrideEnabled}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleOverrideToggle(event.currentTarget.checked)
                }
                disabled={isDeleting}
                size='lg'
                color='var(--color-primary)'
                styles={{
                  track: {
                    '&[data-checked]': {
                      backgroundColor: 'var(--color-primary)',
                      borderColor: 'var(--color-primary)',
                    },
                  },
                }}
              />
            </Group>

            {overridesLoading ?
              <Center h={100}>
                <LoadingSpinner size='sm' />
              </Center>
            : overrideEnabled && (
                <form onSubmit={form.onSubmit(handleSubmit)}>
                  <Stack gap='md' mt='lg'>
                    <Divider className={cn(styles.divider)} />

                    <EmailSection form={form} />

                    <Divider className={cn(styles.divider)} />

                    <ConnectionSection form={form} />

                    <Divider className={cn(styles.divider)} />

                    <ProfileSection form={form} />

                    {hasChanges && (
                      <Group justify='flex-end' mt='md' className={cn(styles.buttonGroup)}>
                        <Button variant='secondary' onClick={handleReset} disabled={isUpdating}>
                          Cancel
                        </Button>
                        <Button variant='primary' type='submit' loading={isUpdating}>
                          Save Event Overrides
                        </Button>
                      </Group>
                    )}
                  </Stack>
                </form>
              )
            }
          </Card>
        </>
      )}
    </Stack>
  );
};

export default EventOverrides;
