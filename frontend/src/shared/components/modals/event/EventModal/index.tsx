import {
  TextInput,
  Stack,
  Modal,
  Select,
  Textarea,
  Text,
  Alert,
  Button as MantineButton,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useCreateEventMutation,
  useUpdateEventMutation,
  useGetEventQuery,
} from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import { eventSchema, eventUpdateSchema } from './schemas/eventSchema';
import { useEffect } from 'react';
import styles from './styles/index.module.css';
import { useFormatDate } from '@/shared/hooks/formatDate';
import { COMMON_TIMEZONES } from '@/shared/constants/timezones';
import type { ApiError } from '@/types/api';

const EVENT_TYPES = [
  { value: 'CONFERENCE', label: 'Conference' },
  { value: 'SINGLE_SESSION', label: 'Single Session' },
] as const;

const SINGLE_SESSION_TYPE = 'SINGLE_SESSION';

type EventTypeValue = 'CONFERENCE' | 'SINGLE_SESSION';

interface EventFormValues {
  title: string;
  description: string;
  event_type: EventTypeValue;
  start_date: string;
  end_date: string;
  timezone: string;
  company_name: string;
}

interface EventData {
  id: number;
  title: string;
  description?: string | null;
  event_type: EventTypeValue;
  start_date: string;
  end_date: string;
  timezone: string;
  company_name: string;
  sessions?: Array<{ id: number }>;
}

interface EventModalProps {
  event?: EventData | null;
  orgId: number;
  opened: boolean;
  onClose: () => void;
  allowConferences?: boolean;
}

export const EventModal = ({
  event,
  orgId,
  opened,
  onClose,
  allowConferences = false,
}: EventModalProps) => {
  const { formatDateForInput } = useFormatDate();

  const isEditing = !!event;
  const { data: eventDetails } = useGetEventQuery(event?.id ? { id: event.id } : skipToken, {
    skip: !event?.id || event?.event_type !== SINGLE_SESSION_TYPE,
  }) as { data: EventData | undefined };
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const isLoading = isCreating || isUpdating;
  const hasSession = (eventDetails?.sessions?.length ?? 0) > 0;

  const form = useForm<EventFormValues>({
    initialValues: {
      title: event?.title || '',
      description: event?.description || '',
      event_type: event?.event_type || SINGLE_SESSION_TYPE,
      start_date: event?.start_date ? formatDateForInput(event.start_date) : '',
      end_date: event?.end_date ? formatDateForInput(event.end_date) : '',
      timezone: event?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      company_name: event?.company_name || '',
    },
    validate: zodResolver(isEditing ? eventUpdateSchema : eventSchema),
  });

  // Handle single session end date
  useEffect(() => {
    if (form.values.event_type === SINGLE_SESSION_TYPE && form.values.start_date) {
      form.setFieldValue('end_date', form.values.start_date);
    }
    // IMPORTANT: DO NOT add 'form' to dependencies - it causes infinite re-renders
    // The form object from useForm is stable, but including it triggers updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.start_date, form.values.event_type]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!opened) {
      form.reset();
    }
    // IMPORTANT: DO NOT add 'form' to dependencies - it causes infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const availableEventTypes =
    allowConferences ? EVENT_TYPES : (
      EVENT_TYPES.filter((type) => type.value === SINGLE_SESSION_TYPE)
    );

  const handleSubmit = async (values: EventFormValues) => {
    try {
      if (isEditing && event) {
        await updateEvent({
          id: event.id,
          title: values.title,
          description: values.description,
          start_date: values.start_date,
          end_date: values.end_date,
          timezone: values.timezone,
        }).unwrap();
      } else {
        await createEvent({
          orgId,
          title: values.title,
          event_type: values.event_type,
          company_name: values.company_name,
          description: values.description,
          start_date: values.start_date,
          end_date: values.end_date,
          timezone: values.timezone,
        }).unwrap();
      }

      onClose();
    } catch (err: unknown) {
      const error = err as ApiError;
      console.log('Error response:', error);
      const jsonErrors = error.data?.errors as Record<string, unknown> | undefined;
      const schemaErrors = (jsonErrors?.json as Record<string, unknown> | undefined)?._schema as
        | string[]
        | undefined;
      if (schemaErrors) {
        form.setErrors({
          _schema: schemaErrors[0],
        });
      } else if (error.data?.errors) {
        const formErrors: Record<string, string> = {};
        Object.entries(error.data.errors).forEach(([key, value]) => {
          const stringValue = Array.isArray(value) ? value[0] : value;
          formErrors[key] = String(stringValue ?? 'Unknown error');
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
      size='md'
      lockScroll={false}
      classNames={{
        content: styles.modalContent || '',
        header: styles.modalHeader || '',
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap='md' p='lg'>
          <TextInput
            label='Event Title'
            placeholder='Enter event title'
            required
            {...form.getInputProps('title')}
            disabled={isLoading}
            classNames={{
              input: styles.formInput || '',
              label: styles.formLabel || '',
            }}
          />

          <Textarea
            label='Description'
            placeholder='Enter event description'
            {...form.getInputProps('description')}
            disabled={isLoading}
            minRows={4}
            classNames={{
              input: styles.formTextarea || '',
              label: styles.formLabel || '',
            }}
          />

          {allowConferences && (
            <Select
              label='Event Type'
              data={[...availableEventTypes]}
              required
              {...form.getInputProps('event_type')}
              disabled={isLoading || hasSession}
              description={
                hasSession ? 'Event type cannot be modified once sessions are created' : undefined
              }
              classNames={{
                input: styles.formSelect || '',
                label: styles.formLabel || '',
              }}
            />
          )}

          <TextInput
            type='date'
            label='Start Date'
            required
            {...form.getInputProps('start_date')}
            disabled={isLoading || hasSession}
            description={
              hasSession ? 'Start date cannot be modified once sessions are created' : undefined
            }
            classNames={{
              input: styles.formInput || '',
              label: styles.formLabel || '',
            }}
          />

          <TextInput
            type='date'
            label='End Date'
            required
            {...form.getInputProps('end_date')}
            disabled={isLoading || form.values.event_type === SINGLE_SESSION_TYPE || hasSession}
            min={form.values.start_date}
            description={
              form.values.event_type === SINGLE_SESSION_TYPE ?
                'Single session events are one-day events'
              : hasSession ?
                'End date cannot be modified once sessions are created'
              : undefined
            }
            classNames={{
              input: styles.formInput || '',
              label: styles.formLabel || '',
            }}
          />

          <TextInput
            label='Company Name'
            placeholder='Enter company name'
            required
            {...form.getInputProps('company_name')}
            disabled={isLoading}
            classNames={{
              input: styles.formInput || '',
              label: styles.formLabel || '',
            }}
          />

          <Select
            label='Event Timezone'
            description='All event times will be in this timezone'
            data={COMMON_TIMEZONES}
            searchable
            required
            {...form.getInputProps('timezone')}
            disabled={isLoading}
            classNames={{
              input: styles.formSelect || '',
              label: styles.formLabel || '',
            }}
          />

          {form.errors._schema && (
            <Text c='red' size='sm' className={styles.errorMessage || ''}>
              {String(form.errors._schema)}
            </Text>
          )}

          {/* Draft Status Disclaimer - only show when creating */}
          {!isEditing && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              className={styles.warningAlert || ''}
              color='yellow'
            >
              <Text size='sm' c='dimmed'>
                Your event will not appear on dashboards until published. After creating, visit your
                event from the Organization page to customize details and publish when ready.
              </Text>
            </Alert>
          )}

          <div className={styles.buttonGroup || ''}>
            <MantineButton variant='subtle' onClick={onClose} disabled={isLoading}>
              Cancel
            </MantineButton>
            <Button type='submit' variant='primary' disabled={isLoading}>
              {isLoading ?
                isEditing ?
                  'Updating...'
                : 'Creating...'
              : isEditing ?
                'Update Event'
              : 'Create Event'}
            </Button>
          </div>
        </Stack>
      </form>
    </Modal>
  );
};
