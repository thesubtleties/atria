import {
  TextInput,
  Button,
  Stack,
  Modal,
  Textarea,
  Select,
  Group,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm, zodResolver } from '@mantine/form';
import {
  useCreateSessionMutation,
  useUpdateSessionMutation,
} from '@/app/features/sessions/api';
import { useGetEventQuery } from '@/app/features/events/api';
import { editSessionSchema } from './schemas/editSessionSchema';

const SESSION_TYPES = [
  { value: 'KEYNOTE', label: 'Keynote' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'PANEL', label: 'Panel Discussion' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'QA', label: 'Q&A Session' },
];

const getTimeFromDateTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const EditSessionModal = ({
  eventId,
  session,
  opened,
  onClose,
  onSuccess,
  isEditing = false,
}) => {
  const [createSession, { isLoading: isCreating }] = useCreateSessionMutation();
  const [updateSession, { isLoading: isUpdating }] = useUpdateSessionMutation();
  const { data: event } = useGetEventQuery(session?.event_id || eventId);

  const isLoading = isCreating || isUpdating;

  const form = useForm({
    initialValues: isEditing
      ? {
          title: session.title,
          description: session.description || '',
          session_type: session.session_type,
          start_time: getTimeFromDateTime(session.start_time),
          end_time: getTimeFromDateTime(session.end_time),
          stream_url: session.stream_url || '',
        }
      : {
          title: '',
          description: '',
          session_type: 'PRESENTATION',
          start_time: '09:00',
          end_time: '10:00',
          stream_url: '',
        },
    validate: zodResolver(editSessionSchema),
  });

  const handleSubmit = async (values) => {
    try {
      // Get event start date
      const eventDate = event.start_date.split('T')[0]; // Gets "2025-01-23"

      // Create the start and end DateTimes using the event date (in UTC)
      const startDateTime = new Date(
        `${eventDate}T${values.start_time}:00.000Z`
      );
      const endDateTime = new Date(`${eventDate}T${values.end_time}:00.000Z`);

      const sessionData = {
        title: values.title,
        description: values.description,
        session_type: values.session_type,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        stream_url: values.stream_url || '',
        day_number: 1,
      };

      console.log('Times being sent:', {
        start: sessionData.start_time,
        end: sessionData.end_time,
      });

      let result;
      if (isEditing) {
        result = await updateSession({
          id: session.id,
          ...sessionData,
        }).unwrap();
      } else {
        result = await createSession({
          eventId,
          ...sessionData,
        }).unwrap();
      }

      onSuccess?.(result.id);
      onClose();
    } catch (error) {
      console.error('Submission error:', {
        message: error.message,
        values: values,
      });
      form.setErrors({ title: 'Failed to update session' });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? 'Edit Session' : 'Create Session'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Session Title"
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Description"
            placeholder="Session Description"
            minRows={3}
            {...form.getInputProps('description')}
          />

          <Select
            label="Session Type"
            data={SESSION_TYPES}
            required
            {...form.getInputProps('session_type')}
          />

          <Group grow>
            <TimeInput
              label="Start Time (UTC)"
              required
              format="24"
              {...form.getInputProps('start_time')}
            />

            <TimeInput
              label="End Time (UTC)"
              required
              format="24"
              {...form.getInputProps('end_time')}
            />
          </Group>

          <TextInput
            label="Stream URL"
            placeholder="Vimeo Stream URL"
            {...form.getInputProps('stream_url')}
          />

          <Button type="submit" loading={isLoading} fullWidth mt="md">
            {isLoading
              ? isEditing
                ? 'Saving...'
                : 'Creating...'
              : isEditing
                ? 'Save Changes'
                : 'Create Session'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};
