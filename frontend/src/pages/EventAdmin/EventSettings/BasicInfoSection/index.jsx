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
import { eventUpdateSchema } from '../schemas/eventSettingsSchemas';
import { Button } from '@/shared/components/buttons';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

const BasicInfoSection = ({ event, eventId }) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm({
    initialValues: {
      title: event?.title || '',
      description: event?.description || '',
      event_type: event?.event_type || 'CONFERENCE',
      start_date: event?.start_date ? new Date(event.start_date) : null,
      end_date: event?.end_date ? new Date(event.end_date) : null,
      company_name: event?.company_name || '',
      status: event?.status || 'DRAFT',
    },
    resolver: zodResolver(eventUpdateSchema),
  });

  // Track changes
  useEffect(() => {
    const checkChanges = () => {
      const changed = Object.keys(form.values).some(key => {
        if (key === 'start_date' || key === 'end_date') {
          const eventDate = event?.[key] ? new Date(event[key]).toISOString().split('T')[0] : null;
          const formDate = form.values[key] ? form.values[key].toISOString().split('T')[0] : null;
          return eventDate !== formDate;
        }
        return form.values[key] !== event?.[key];
      });
      setHasChanges(changed);
    };

    checkChanges();
  }, [form.values, event]);

  const handleSubmit = async (values) => {
    try {
      await updateEvent({
        id: eventId,
        ...values,
        start_date: values.start_date?.toISOString().split('T')[0],
        end_date: values.end_date?.toISOString().split('T')[0],
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
      start_date: event?.start_date ? new Date(event.start_date) : null,
      end_date: event?.end_date ? new Date(event.end_date) : null,
      company_name: event?.company_name || '',
      status: event?.status || 'DRAFT',
    });
    setHasChanges(false);
  };

  return (
    <div className={`${parentStyles.section} ${styles.glassSection}`}>
      <h3 className={parentStyles.sectionTitle}>Basic Information</h3>
      <Text c="dimmed" size="sm" mb="xl">
        Update your event's core details and configuration
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