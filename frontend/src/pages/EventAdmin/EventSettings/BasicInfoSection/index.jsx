import { useState, useEffect } from 'react';
import {
  TextInput,
  Textarea,
  Select,
  Stack,
  Group,
  Text
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { useGetSessionsQuery } from '@/app/features/sessions/api';
import { useEventStatusStyle } from '@/shared/hooks/useEventStatusStyle';
import { parseDateOnly, formatDateOnly } from '@/shared/hooks/formatDate';
import { eventUpdateSchema } from '../schemas/eventSettingsSchemas';
import { Button } from '@/shared/components/buttons';
import { COMMON_TIMEZONES } from '@/shared/constants/timezones';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

const BasicInfoSection = ({ event, eventId }) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);
  const { getStatusStyles } = useEventStatusStyle();

  // Fetch sessions when event_type is single_session
  const { data: sessionsData } = useGetSessionsQuery(
    { eventId: parseInt(eventId) },
    { skip: event?.event_type !== 'SINGLE_SESSION' }
  );

  const form = useForm({
    initialValues: {
      title: event?.title || '',
      description: event?.description || '',
      event_type: event?.event_type || 'CONFERENCE',
      start_date: parseDateOnly(event?.start_date),
      end_date: parseDateOnly(event?.end_date),
      timezone: event?.timezone || 'UTC',
      company_name: event?.company_name || '',
      status: event?.status || 'DRAFT',
      main_session_id: event?.main_session_id || null,
    },
    resolver: zodResolver(eventUpdateSchema),
  });

  // Track changes
  useEffect(() => {
    const checkChanges = () => {
      const changed = Object.keys(form.values).some(key => {
        if (key === 'start_date' || key === 'end_date') {
          // Compare dates as YYYY-MM-DD strings to avoid timezone issues
          const eventDate = event?.[key] || null;
          const formDate = formatDateOnly(form.values[key]);
          return eventDate !== formDate;
        }
        return form.values[key] !== event?.[key];
      });
      setHasChanges(changed);
    };

    checkChanges();
  }, [form.values, event]);
  
  // Prepare session options for dropdown
  const sessionOptions = sessionsData?.sessions?.map(session => ({
    value: session.id.toString(),
    label: `Day ${session.day_number}: ${session.title} (${session.start_time})`
  })) || [];

  const handleSubmit = async (values) => {
    try {
      await updateEvent({
        id: eventId,
        ...values,
        start_date: formatDateOnly(values.start_date),
        end_date: formatDateOnly(values.end_date),
        main_session_id: values.main_session_id ? parseInt(values.main_session_id) : null,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Event basic info updated successfully',
        color: 'green',
      });
      setHasChanges(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update event',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    form.setValues({
      title: event?.title || '',
      description: event?.description || '',
      event_type: event?.event_type || 'CONFERENCE',
      start_date: parseDateOnly(event?.start_date),
      end_date: parseDateOnly(event?.end_date),
      timezone: event?.timezone || 'UTC',
      company_name: event?.company_name || '',
      status: event?.status || 'DRAFT',
      main_session_id: event?.main_session_id || null,
    });
    setHasChanges(false);
  };

  return (
    <div className={`${parentStyles.section} ${styles.glassSection}`}>
      <h3 className={parentStyles.sectionTitle}>Basic Information</h3>
      <Text c="dimmed" size="sm" mb="xl">
        {`Update your event's core details and configuration`}
      </Text>
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <TextInput
            label="Event Title"
            placeholder="Enter event title"
            required
            classNames={{
              input: styles.formInput,
              label: styles.formLabel
            }}
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Description"
            placeholder="Enter event description"
            minRows={3}
            classNames={{
              input: styles.formInput,
              label: styles.formLabel
            }}
            {...form.getInputProps('description')}
          />

          <Group grow>
            <Select
              label="Event Type"
              data={[
                { value: 'CONFERENCE', label: 'Conference' },
                { value: 'SINGLE_SESSION', label: 'Single Session' },
              ]}
              required
              classNames={{
                input: styles.formInput,
                label: styles.formLabel
              }}
              {...form.getInputProps('event_type')}
            />

            <Select
              label="Status"
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
                }
              }}
              classNames={{
                input: styles.formInput,
                label: styles.formLabel
              }}
              {...form.getInputProps('status')}
            />
          </Group>

          <Group grow>
            <DateInput
              label="Start Date"
              placeholder="Select start date"
              required
              classNames={{
                input: styles.formInput,
                label: styles.formLabel
              }}
              {...form.getInputProps('start_date')}
            />

            <DateInput
              label="End Date"
              placeholder="Select end date"
              required
              classNames={{
                input: styles.formInput,
                label: styles.formLabel
              }}
              {...form.getInputProps('end_date')}
            />
          </Group>

          <TextInput
            label="Company Name"
            placeholder="Enter company name"
            required
            classNames={{
              input: styles.formInput,
              label: styles.formLabel
            }}
            {...form.getInputProps('company_name')}
          />

          <Select
            label="Event Timezone"
            description="All session times are interpreted in this timezone"
            data={COMMON_TIMEZONES}
            searchable
            required
            classNames={{
              input: styles.formInput,
              label: styles.formLabel
            }}
            {...form.getInputProps('timezone')}
          />

          {form.values.event_type === 'SINGLE_SESSION' && sessionOptions.length > 0 && (
            <Select
              label="Main Session"
              placeholder="Select the main session to link to"
              description="For single-session events, this session will be directly linked from the navigation"
              data={sessionOptions}
              clearable
              searchable
              classNames={{
                input: styles.formInput,
                label: styles.formLabel
              }}
              {...form.getInputProps('main_session_id')}
              value={form.values.main_session_id?.toString() || null}
              onChange={(value) => form.setFieldValue('main_session_id', value)}
            />
          )}

          {hasChanges && (
            <Group justify="flex-end" className={parentStyles.formActions}>
              <Button variant="subtle" onClick={handleReset}>
                <IconX size={16} />
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                loading={isLoading}
              >
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