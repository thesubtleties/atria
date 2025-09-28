import {
  TextInput,
  Stack,
  Modal,
  Textarea,
  Select,
  Group,
  Text,
} from '@mantine/core';
import { TimeSelect } from '@/shared/components/forms/TimeSelect';
import { useForm, zodResolver } from '@mantine/form';
import {
  useCreateSessionMutation,
  useUpdateSessionMutation,
} from '@/app/features/sessions/api';
import { useGetEventQuery } from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import { editSessionSchema } from './schemas/editSessionSchema';
import styles from './styles/index.module.css';

const SESSION_TYPES = [
  { value: 'KEYNOTE', label: 'Keynote' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'PANEL', label: 'Panel Discussion' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'QA', label: 'Q&A Session' },
];

const CHAT_MODES = [
  { value: 'ENABLED', label: 'All Chat Enabled (Public & Backstage)' },
  { value: 'BACKSTAGE_ONLY', label: 'Backstage Chat Only' },
  { value: 'DISABLED', label: 'Chat Disabled' },
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
          short_description: session.short_description || '',
          description: session.description || '',
          session_type: session.session_type,
          start_time: session.start_time.substring(0, 5), // Updated to be in HH:mm format
          end_time: session.end_time.substring(0, 5), // Updated to be in HH:mm format
          day_number: session.day_number.toString(),
          stream_url: session.stream_url || '',
          chat_mode: session.chat_mode || 'ENABLED',
        }
      : {
          title: '',
          short_description: '',
          description: '',
          session_type: 'PRESENTATION',
          start_time: '09:00',
          end_time: '10:00',
          day_number: '1',
          stream_url: '',
          chat_mode: 'ENABLED',
        },
    validate: (values) => {
      console.log('Validation values:', values);
      return zodResolver(editSessionSchema)(values);
    },
    transform: {
      input: (values) => ({
        ...values,
        // Ensure consistent HH:mm format for both touched and untouched times
        start_time: values.start_time?.substring(0, 5),
        end_time: values.end_time?.substring(0, 5),
      }),
    },
  });

  const handleSubmit = async (values) => {
    try {
      const sessionData = {
        title: values.title,
        short_description: values.short_description,
        description: values.description,
        session_type: values.session_type,
        start_time: values.start_time, // Just send HH:mm
        end_time: values.end_time, // Just send HH:mm
        day_number: parseInt(values.day_number, 10),
        stream_url: values.stream_url || '',
        chat_mode: values.chat_mode,
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
      title={isEditing ? 'Edit Session' : 'Create New Session'}
      centered
      size="lg"
      lockScroll={false}
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md" p="lg">
          <Text className={styles.sectionTitle}>Basic Information</Text>

          <TextInput
            label="Session Title"
            placeholder="Enter a descriptive title for your session"
            required
            classNames={{ input: styles.formInput }}
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Short Description"
            placeholder="Brief description for the agenda view (max 200 characters)"
            description="This will appear in the event agenda"
            minRows={2}
            maxLength={200}
            classNames={{ input: styles.shortDescriptionTextarea }}
            {...form.getInputProps('short_description')}
          />

          <Textarea
            label="Full Description"
            placeholder="Provide a detailed description for attendees"
            description="This will appear on the session detail page"
            minRows={4}
            classNames={{ input: styles.formTextarea }}
            {...form.getInputProps('description')}
          />

          <Text className={styles.sectionTitle}>Session Details</Text>

          <Select
            label="Session Type"
            placeholder="Select the type of session"
            data={SESSION_TYPES}
            required
            classNames={{ input: styles.formSelect }}
            {...form.getInputProps('session_type')}
          />

          <Select
            label="Event Day"
            placeholder="Select which day this session occurs"
            data={availableDays}
            required
            classNames={{ input: styles.formSelect }}
            {...form.getInputProps('day_number')}
          />

          <Group grow className={styles.timeInputGroup}>
            <TimeSelect
              label="Start Time"
              required
              placeholder="Select start time"
              classNames={{ input: styles.formTimeInput }}
              {...form.getInputProps('start_time')}
            />

            <TimeSelect
              label="End Time"
              required
              placeholder="Select end time"
              classNames={{ input: styles.formTimeInput }}
              {...form.getInputProps('end_time')}
            />
          </Group>

          <Text className={styles.sectionTitle}>Streaming & Chat</Text>

          <TextInput
            label="Stream URL"
            placeholder="https://vimeo.com/..."
            description="Optional: Add a Vimeo URL for virtual streaming"
            classNames={{ input: styles.formInput }}
            {...form.getInputProps('stream_url')}
          />

          <Select
            label="Chat Settings"
            placeholder="Choose chat availability"
            data={CHAT_MODES}
            required
            classNames={{ input: styles.formSelect }}
            {...form.getInputProps('chat_mode')}
          />

          <div className={styles.buttonGroup}>
            <Button variant="subtle" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isLoading}>
              {isLoading
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Session'}
            </Button>
          </div>
        </Stack>
      </form>
    </Modal>
  );
};
