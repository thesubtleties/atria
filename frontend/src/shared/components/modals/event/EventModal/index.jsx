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
  useGetEventQuery,
} from '@/app/features/events/api';
import { eventSchema, eventUpdateSchema } from './schemas/eventSchema';
import { useEffect } from 'react';
import styles from './styles/index.module.css';

const EVENT_TYPES = [
  { value: 'CONFERENCE', label: 'Conference' },
  { value: 'SINGLE_SESSION', label: 'Single Session' },
];

const SINGLE_SESSION_TYPE = 'SINGLE_SESSION';

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  return dateString; // Already in YYYY-MM-DD format
};

export const EventModal = ({
  event,
  orgId,
  opened,
  onClose,
  allowConferences = false,
}) => {
  const isEditing = !!event;
  const { data: eventDetails } = useGetEventQuery(event?.id, {
    skip: !event?.id || event?.event_type !== SINGLE_SESSION_TYPE,
  });
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const isLoading = isCreating || isUpdating;
  const hasSession = eventDetails?.sessions?.length > 0;

  const form = useForm({
    initialValues: {
      title: event?.title || '',
      description: event?.description || '',
      event_type: event?.event_type || SINGLE_SESSION_TYPE,
      start_date: event?.start_date ? formatDateForInput(event.start_date) : '',
      end_date: event?.end_date ? formatDateForInput(event.end_date) : '',
      company_name: event?.company_name || '',
    },
    validate: zodResolver(isEditing ? eventUpdateSchema : eventSchema),
  });

  // Handle single session end date
  useEffect(() => {
    if (
      form.values.event_type === SINGLE_SESSION_TYPE &&
      form.values.start_date
    ) {
      form.setFieldValue('end_date', form.values.start_date);
    }
  }, [form.values.start_date, form.values.event_type]);

  // Reset form when modal is closed
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
              disabled={isLoading || hasSession}
              description={
                hasSession
                  ? 'Event type cannot be modified once sessions are created'
                  : undefined
              }
            />
          )}

          <TextInput
            type="date"
            label="Start Date"
            required
            {...form.getInputProps('start_date')}
            disabled={isLoading || hasSession}
            description={
              hasSession
                ? 'Start date cannot be modified once sessions are created'
                : undefined
            }
          />

          <TextInput
            type="date"
            label="End Date"
            required
            {...form.getInputProps('end_date')}
            disabled={
              isLoading ||
              form.values.event_type === SINGLE_SESSION_TYPE ||
              hasSession
            }
            min={form.values.start_date}
            description={
              form.values.event_type === SINGLE_SESSION_TYPE
                ? 'Single session events are one-day events'
                : hasSession
                  ? 'End date cannot be modified once sessions are created'
                  : undefined
            }
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
