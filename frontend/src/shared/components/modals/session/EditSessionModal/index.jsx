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

// Helper to get available days based on event dates
const getEventDays = (event) => {
  if (!event?.start_date || !event?.end_date) return [];

  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const days = [];
  let currentDate = start;
  let dayNumber = 1;

  while (currentDate <= end) {
    days.push({
      value: dayNumber.toString(),
      label: `Day ${dayNumber} - ${currentDate.toLocaleDateString()}`,
    });
    currentDate.setDate(currentDate.getDate() + 1);
    dayNumber++;
  }

  return days;
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

  const availableDays = getEventDays(event);

  const form = useForm({
    initialValues: isEditing
      ? {
          title: session.title,
          description: session.description || '',
          session_type: session.session_type,
          start_time: session.start_time, // Already in HH:mm format
          end_time: session.end_time, // Already in HH:mm format
          day_number: session.day_number.toString(),
          stream_url: session.stream_url || '',
        }
      : {
          title: '',
          description: '',
          session_type: 'PRESENTATION',
          start_time: '09:00',
          end_time: '10:00',
          day_number: '1',
          stream_url: '',
        },
    validate: zodResolver(editSessionSchema),
  });

  const handleSubmit = async (values) => {
    try {
      const sessionData = {
        title: values.title,
        description: values.description,
        session_type: values.session_type,
        start_time: values.start_time, // Just send HH:mm
        end_time: values.end_time, // Just send HH:mm
        day_number: parseInt(values.day_number, 10),
        stream_url: values.stream_url || '',
      };

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
      console.error('Submission error:', error);
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

          <Select
            label="Event Day"
            data={availableDays}
            required
            {...form.getInputProps('day_number')}
          />

          <Group grow>
            <TimeInput
              label="Start Time"
              required
              format="24"
              {...form.getInputProps('start_time')}
            />

            <TimeInput
              label="End Time"
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
