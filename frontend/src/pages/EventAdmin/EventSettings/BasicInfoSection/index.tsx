import { useState, useEffect } from 'react';
import { TextInput, Textarea, Select, Stack, Group, Text } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { useGetSessionsQuery } from '@/app/features/sessions/api';
import { useEventStatusStyle } from '@/shared/hooks/useEventStatusStyle';
// Dates are stored as YYYY-MM-DD strings, used directly with native date input
import { eventUpdateSchema } from '../schemas/eventSettingsSchemas';
import { Button } from '@/shared/components/buttons';
import { COMMON_TIMEZONES } from '@/shared/constants/timezones';
import { cn } from '@/lib/cn';
import type { Event, Session } from '@/types';
import type { ApiError } from '@/types';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

type BasicInfoSectionProps = {
  event: Event | undefined;
  eventId: number;
};

type FormValues = {
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  timezone: string;
  company_name: string;
  status: string;
  main_session_id: string | null;
  session_visibility_minutes: string;
};

const VISIBILITY_WINDOW_OPTIONS = [
  { value: '', label: 'Always visible' },
  { value: '2', label: '2 minutes before/after' },
  { value: '5', label: '5 minutes before/after' },
  { value: '10', label: '10 minutes before/after' },
  { value: '15', label: '15 minutes before/after' },
] as const;

const BasicInfoSection = ({ event, eventId }: BasicInfoSectionProps) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);
  const { getStatusStyles } = useEventStatusStyle();

  // Fetch sessions when event_type is single_session
  const { data: sessionsData } = useGetSessionsQuery(
    { eventId },
    { skip: event?.event_type !== 'SINGLE_SESSION' },
  );

  const form = useForm<FormValues>({
    initialValues: {
      title: event?.title || '',
      description: event?.description || '',
      event_type: event?.event_type || 'CONFERENCE',
      start_date: event?.start_date || '',
      end_date: event?.end_date || '',
      timezone: event?.timezone || 'UTC',
      company_name: event?.company_name || '',
      status: event?.status || 'DRAFT',
      main_session_id: event?.main_session_id?.toString() || null,
      session_visibility_minutes:
        event?.session_visibility_minutes != null ?
          event.session_visibility_minutes.toString()
        : '',
    },
    validate: zodResolver(eventUpdateSchema),
  });

  // Track changes
  useEffect(() => {
    const checkChanges = () => {
      const changed = Object.keys(form.values).some((key) => {
        const formKey = key as keyof FormValues;
        if (formKey === 'start_date' || formKey === 'end_date') {
          // Compare as strings directly (both are YYYY-MM-DD)
          return form.values[formKey] !== (event?.[formKey] || '');
        }
        if (formKey === 'main_session_id') {
          return form.values[formKey] !== (event?.main_session_id?.toString() || null);
        }
        if (formKey === 'session_visibility_minutes') {
          const eventValue =
            event?.session_visibility_minutes != null ?
              event.session_visibility_minutes.toString()
            : '';
          return form.values[formKey] !== eventValue;
        }
        return form.values[formKey] !== event?.[formKey as keyof Event];
      });
      setHasChanges(changed);
    };

    checkChanges();
  }, [form.values, event]);

  // Prepare session options for dropdown
  const sessions = (sessionsData as { sessions?: Session[] } | undefined)?.sessions || [];
  const sessionOptions = sessions.map((session) => ({
    value: session.id.toString(),
    label: `Day ${session.day_number}: ${session.title} (${session.start_time})`,
  }));

  const handleSubmit = async (values: FormValues) => {
    try {
      await updateEvent({
        id: eventId,
        title: values.title,
        description: values.description || null,
        event_type: values.event_type as Event['event_type'],
        start_date: values.start_date,
        end_date: values.end_date,
        timezone: values.timezone,
        company_name: values.company_name,
        status: values.status as Event['status'],
        main_session_id: values.main_session_id ? parseInt(values.main_session_id, 10) : null,
        session_visibility_minutes:
          values.session_visibility_minutes ?
            parseInt(values.session_visibility_minutes, 10)
          : null,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Event basic info updated successfully',
        color: 'green',
      });
      setHasChanges(false);
    } catch (error) {
      const apiError = error as ApiError;
      notifications.show({
        title: 'Error',
        message: apiError.data?.message || 'Failed to update event',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    form.setValues({
      title: event?.title || '',
      description: event?.description || '',
      event_type: event?.event_type || 'CONFERENCE',
      start_date: event?.start_date || '',
      end_date: event?.end_date || '',
      timezone: event?.timezone || 'UTC',
      company_name: event?.company_name || '',
      status: event?.status || 'DRAFT',
      main_session_id: event?.main_session_id?.toString() || null,
      session_visibility_minutes:
        event?.session_visibility_minutes != null ?
          event.session_visibility_minutes.toString()
        : '',
    });
    setHasChanges(false);
  };

  return (
    <div className={cn(parentStyles.section, styles.glassSection)}>
      <h3 className={cn(parentStyles.sectionTitle)}>Basic Information</h3>
      <Text c='dimmed' size='sm' mb='xl'>
        {`Update your event's core details and configuration`}
      </Text>

      <form onSubmit={form.onSubmit((values) => handleSubmit(values as FormValues))}>
        <Stack gap='md'>
          <TextInput
            label='Event Title'
            placeholder='Enter event title'
            required
            classNames={{
              input: styles.formInput ?? '',
              label: styles.formLabel ?? '',
            }}
            {...form.getInputProps('title')}
          />

          <Textarea
            label='Description'
            placeholder='Enter event description'
            minRows={3}
            classNames={{
              input: styles.formInput ?? '',
              label: styles.formLabel ?? '',
            }}
            {...form.getInputProps('description')}
          />

          <Group grow>
            <Select
              label='Event Type'
              data={[
                { value: 'CONFERENCE', label: 'Conference' },
                { value: 'SINGLE_SESSION', label: 'Single Session' },
              ]}
              required
              classNames={{
                input: styles.formInput ?? '',
                label: styles.formLabel ?? '',
              }}
              {...form.getInputProps('event_type')}
            />

            <Select
              label='Status'
              data={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PUBLISHED', label: 'Published' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
              required
              allowDeselect={false}
              styles={{
                input: {
                  ...getStatusStyles(form.values.status),
                  fontWeight: 500,
                },
              }}
              classNames={{
                input: styles.formInput ?? '',
                label: styles.formLabel ?? '',
              }}
              {...form.getInputProps('status')}
            />
          </Group>

          <Group grow>
            <TextInput
              type='date'
              label='Start Date'
              required
              classNames={{
                input: styles.formInput ?? '',
                label: styles.formLabel ?? '',
              }}
              {...form.getInputProps('start_date')}
            />

            <TextInput
              type='date'
              label='End Date'
              required
              min={form.values.start_date}
              classNames={{
                input: styles.formInput ?? '',
                label: styles.formLabel ?? '',
              }}
              {...form.getInputProps('end_date')}
            />
          </Group>

          <TextInput
            label='Company Name'
            placeholder='Enter company name'
            required
            classNames={{
              input: styles.formInput ?? '',
              label: styles.formLabel ?? '',
            }}
            {...form.getInputProps('company_name')}
          />

          <Select
            label='Event Timezone'
            description='All session times are interpreted in this timezone'
            data={COMMON_TIMEZONES}
            searchable
            required
            classNames={{
              input: styles.formInput ?? '',
              label: styles.formLabel ?? '',
            }}
            {...form.getInputProps('timezone')}
          />

          <Select
            label='Session Visibility Window'
            description='Default window for when session content becomes accessible (can be overridden per session)'
            data={[...VISIBILITY_WINDOW_OPTIONS]}
            allowDeselect={false}
            classNames={{
              input: styles.formInput ?? '',
              label: styles.formLabel ?? '',
            }}
            {...form.getInputProps('session_visibility_minutes')}
          />

          {form.values.event_type === 'SINGLE_SESSION' && sessionOptions.length > 0 && (
            <Select
              label='Main Session'
              placeholder='Select the main session to link to'
              description='For single-session events, this session will be directly linked from the navigation'
              data={sessionOptions}
              clearable
              searchable
              classNames={{
                input: styles.formInput ?? '',
                label: styles.formLabel ?? '',
              }}
              value={form.values.main_session_id}
              onChange={(value) => form.setFieldValue('main_session_id', value)}
            />
          )}

          {hasChanges && (
            <Group justify='flex-end' className={cn(parentStyles.formActions)}>
              <Button variant='secondary' onClick={handleReset}>
                <IconX size={16} />
                Cancel
              </Button>
              <Button type='submit' variant='primary' loading={isLoading}>
                <IconCheck size={16} />
                Save Changes
              </Button>
            </Group>
          )}
        </Stack>
      </form>
    </div>
  );
};

export default BasicInfoSection;
