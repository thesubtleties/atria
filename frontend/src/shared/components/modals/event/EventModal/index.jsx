// shared/components/modals/event/EventModal/index.jsx
import {
  TextInput,
  Button,
  Stack,
  Modal,
  Select,
  Textarea,
  Text,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import {
  useCreateEventMutation,
  useUpdateEventMutation,
} from '@/app/features/events/api';
import { eventSchema } from './schemas/eventSchema';
import { useEffect } from 'react';
import styles from './styles/index.module.css';

const EVENT_TYPES = [
  { value: 'CONFERENCE', label: 'Conference' },
  { value: 'SINGLE_SESSION', label: 'Single Session' },
];

export const EventModal = ({ event, orgId, opened, onClose }) => {
  const isEditing = !!event;

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();

  const isLoading = isCreating || isUpdating;

  const form = useForm({
    initialValues: {
      title: event?.title || '',
      description: event?.description || '',
      event_type: event?.event_type || 'CONFERENCE',
      start_date: event?.start_date
        ? new Date(event.start_date).toISOString().split('T')[0]
        : '',
      end_date: event?.end_date
        ? new Date(event.end_date).toISOString().split('T')[0]
        : '',
      company_name: event?.company_name || '',
    },
    validate: zodResolver(eventSchema),
    transformValues: (values) => ({
      ...values,
      start_date: new Date(values.start_date).toISOString(),
      end_date: new Date(values.end_date).toISOString(),
    }),
  });

  useEffect(() => {
    if (!opened) {
      form.reset();
    }
  }, [opened]);

  const handleSubmit = async (values) => {
    try {
      if (isEditing) {
        await updateEvent({
          id: event.id,
          ...values,
        }).unwrap();
      } else {
        await createEvent({
          orgId,
          ...values,
        }).unwrap();
      }

      onClose();
    } catch (error) {
      console.log('Error response:', error);
      if (error.data?.errors?.json?._schema) {
        form.setErrors({
          _schema: error.data.errors.json._schema[0],
        });
      } else if (error.data?.errors) {
        const formErrors = {};
        Object.entries(error.data.errors).forEach(([key, value]) => {
          formErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        form.setErrors(formErrors);
      } else {
        form.setErrors({
          _schema: 'An unexpected error occurred',
        });
      }
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? 'Edit Event' : 'Create Event'}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
        <Stack gap="md">
          <TextInput
            label="Event Title"
            placeholder="Enter event title"
            required
            {...form.getInputProps('title')}
            disabled={isLoading}
          />

          <Textarea
            label="Description"
            placeholder="Enter event description"
            {...form.getInputProps('description')}
            disabled={isLoading}
          />

          <Select
            label="Event Type"
            data={EVENT_TYPES}
            required
            {...form.getInputProps('event_type')}
            disabled={isLoading}
          />

          <TextInput
            type="date"
            label="Start Date"
            required
            {...form.getInputProps('start_date')}
            disabled={isLoading}
          />

          <TextInput
            type="date"
            label="End Date"
            required
            {...form.getInputProps('end_date')}
            disabled={isLoading}
            min={form.values.start_date}
          />

          <TextInput
            label="Company Name"
            placeholder="Enter company name"
            required
            {...form.getInputProps('company_name')}
            disabled={isLoading}
          />

          <Button type="submit" loading={isLoading} fullWidth>
            {isLoading
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update Event'
                : 'Create Event'}
          </Button>

          {form.errors._schema && (
            <Text color="red" size="sm" align="center">
              {form.errors._schema}
            </Text>
          )}
        </Stack>
      </form>
    </Modal>
  );
};
