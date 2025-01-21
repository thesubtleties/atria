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

const SINGLE_SESSION_TYPE = 'SINGLE_SESSION';

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const createUTCDate = (dateString) => {
  return `${dateString}T00:00:00.000Z`;
};

export const EventModal = ({
  event,
  orgId,
  opened,
  onClose,
  allowConferences = false,
}) => {
  const isEditing = !!event;
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const isLoading = isCreating || isUpdating;

  const form = useForm({
    initialValues: {
      title: event?.title || '',
      description: event?.description || '',
      event_type: event?.event_type || SINGLE_SESSION_TYPE,
      start_date: event?.start_date ? formatDateForInput(event.start_date) : '',
      end_date: event?.end_date ? formatDateForInput(event.end_date) : '',
      company_name: event?.company_name || '',
    },
    validate: zodResolver(eventSchema),
    transformValues: (values) => ({
      ...values,
      start_date: createUTCDate(values.start_date),
      end_date: createUTCDate(values.end_date),
    }),
  });

  useEffect(() => {
    if (
      form.values.event_type === SINGLE_SESSION_TYPE &&
      form.values.start_date
    ) {
      const nextDay = new Date(`${form.values.start_date}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      form.setFieldValue('end_date', nextDay.toISOString().split('T')[0]);
    }
  }, [form.values.start_date, form.values.event_type]);

  useEffect(() => {
    if (!opened) {
      form.reset();
    }
  }, [opened]);

  const availableEventTypes = allowConferences
    ? EVENT_TYPES
    : EVENT_TYPES.filter((type) => type.value === SINGLE_SESSION_TYPE);

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
      centered
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

          {allowConferences && (
            <Select
              label="Event Type"
              data={availableEventTypes}
              required
              {...form.getInputProps('event_type')}
              disabled={isLoading}
            />
          )}

          <TextInput
            type="date"
            label="Start Date (UTC)"
            required
            {...form.getInputProps('start_date')}
            disabled={isLoading}
          />

          <TextInput
            type="date"
            label="End Date (UTC)"
            required
            {...form.getInputProps('end_date')}
            disabled={
              isLoading || form.values.event_type === SINGLE_SESSION_TYPE
            }
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
            <Text c="red" size="sm" align="center">
              {form.errors._schema}
            </Text>
          )}
        </Stack>
      </form>
    </Modal>
  );
};
