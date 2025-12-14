import { useEffect } from 'react';
import {
  TextInput,
  Stack,
  Modal,
  Textarea,
  Select,
  Group,
  Text,
  Button as MantineButton,
} from '@mantine/core';
import { skipToken } from '@reduxjs/toolkit/query';
import { TimeSelect } from '@/shared/components/forms/TimeSelect';
import { useForm, zodResolver } from '@mantine/form';
import { useCreateSessionMutation, useUpdateSessionMutation } from '@/app/features/sessions/api';
import { parseDateOnly } from '@/shared/hooks/formatDate';
import { useGetEventQuery } from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import { editSessionSchema } from './schemas/editSessionSchema';
import styles from './styles/index.module.css';

type SessionChatMode = 'ENABLED' | 'BACKSTAGE_ONLY' | 'DISABLED';

interface SessionData {
  id: number;
  event_id: number;
  title: string;
  short_description?: string | null;
  description?: string | null;
  session_type: string;
  start_time: string;
  end_time: string;
  day_number: number;
  chat_mode?: SessionChatMode;
  streaming_platform?: string | null;
  stream_url?: string | null;
  zoom_meeting_id?: string | null;
  zoom_passcode?: string | null;
  mux_playback_policy?: 'PUBLIC' | 'SIGNED' | null;
  jitsi_room_name?: string | null;
}

interface EventData {
  id: number;
  start_date: string;
  end_date: string;
}

const SESSION_TYPES = [
  { value: 'KEYNOTE', label: 'Keynote' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'PANEL', label: 'Panel Discussion' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'QA', label: 'Q&A Session' },
] as const;

const CHAT_MODES = [
  { value: 'ENABLED', label: 'All Chat Enabled (Public & Backstage)' },
  { value: 'BACKSTAGE_ONLY', label: 'Backstage Chat Only' },
  { value: 'DISABLED', label: 'Chat Disabled' },
] as const;

const STREAMING_PLATFORMS = [
  { value: '', label: 'No Streaming' }, // Empty string instead of null
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'MUX', label: 'Mux Video' },
  { value: 'ZOOM', label: 'Zoom Meeting' },
  { value: 'JITSI', label: 'Jitsi Meet (JaaS)' },
  { value: 'OTHER', label: 'Other (External Link)' },
] as const;

const MUX_PLAYBACK_POLICIES = [
  { value: 'PUBLIC', label: 'Public (Anyone with link)' },
  { value: 'SIGNED', label: 'Signed (Requires authentication)' },
] as const;

interface EventDay {
  value: string;
  label: string;
}

// Helper to get available days based on event dates
const getEventDays = (event: EventData | undefined): EventDay[] => {
  if (!event?.start_date || !event?.end_date) return [];

  const start = parseDateOnly(event.start_date);
  const end = parseDateOnly(event.end_date);
  if (!start || !end) return [];

  const days: EventDay[] = [];
  const currentDate = new Date(start);
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

interface SessionFormValues {
  title: string;
  short_description: string;
  description: string;
  session_type: string;
  start_time: string;
  end_time: string;
  day_number: string;
  chat_mode: SessionChatMode;
  streaming_platform: string;
  stream_url: string;
  zoom_meeting_id: string;
  zoom_passcode: string;
  mux_playback_policy: 'PUBLIC' | 'SIGNED';
  jitsi_room_name: string;
}

interface EditSessionModalProps {
  eventId?: number;
  session?: SessionData;
  opened: boolean;
  onClose: () => void;
  onSuccess?: (sessionId: number) => void;
  isEditing?: boolean;
}

export const EditSessionModal = ({
  eventId,
  session,
  opened,
  onClose,
  onSuccess,
  isEditing = false,
}: EditSessionModalProps) => {
  const [createSession, { isLoading: isCreating }] = useCreateSessionMutation();
  const [updateSession, { isLoading: isUpdating }] = useUpdateSessionMutation();
  const effectiveEventId = session?.event_id || eventId;
  const { data: event } = useGetEventQuery(
    effectiveEventId ? { id: effectiveEventId } : skipToken,
    { skip: !effectiveEventId },
  ) as { data: EventData | undefined };
  const isLoading = isCreating || isUpdating;

  const availableDays = getEventDays(event);

  const getInitialValues = (): SessionFormValues => {
    if (isEditing && session) {
      return {
        title: session.title,
        short_description: session.short_description || '',
        description: session.description || '',
        session_type: session.session_type,
        start_time: session.start_time.substring(0, 5),
        end_time: session.end_time.substring(0, 5),
        day_number: session.day_number.toString(),
        chat_mode: session.chat_mode || 'ENABLED',
        streaming_platform: session.streaming_platform || '',
        stream_url: session.stream_url || '',
        zoom_meeting_id: session.zoom_meeting_id || '',
        zoom_passcode: session.zoom_passcode || '',
        mux_playback_policy: session.mux_playback_policy || 'PUBLIC',
        jitsi_room_name: session.jitsi_room_name || '',
      };
    }
    return {
      title: '',
      short_description: '',
      description: '',
      session_type: 'PRESENTATION',
      start_time: '09:00',
      end_time: '10:00',
      day_number: '1',
      chat_mode: 'ENABLED',
      streaming_platform: '',
      stream_url: '',
      zoom_meeting_id: '',
      zoom_passcode: '',
      mux_playback_policy: 'PUBLIC',
      jitsi_room_name: '',
    };
  };

  const form = useForm<SessionFormValues>({
    initialValues: getInitialValues(),
    validate: (values) => {
      console.log('Validation values:', values);
      return zodResolver(editSessionSchema)(values);
    },
    transformValues: (values) => ({
      ...values,
      start_time: values.start_time?.substring(0, 5),
      end_time: values.end_time?.substring(0, 5),
    }),
  });

  // Clear streaming fields when platform changes to "No Streaming"
  useEffect(() => {
    if (!form.values.streaming_platform) {
      // Clear all streaming fields when platform is cleared
      form.setFieldValue('stream_url', '');
      form.setFieldValue('zoom_meeting_id', '');
      form.setFieldValue('zoom_passcode', '');
      form.setFieldValue('mux_playback_policy', 'PUBLIC');
      form.setFieldValue('jitsi_room_name', '');
      // Note: OTHER platform uses stream_url (cleared above)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.streaming_platform]);

  const handleSubmit = async (values: SessionFormValues) => {
    try {
      const sessionData = {
        title: values.title,
        short_description: values.short_description,
        description: values.description,
        session_type: values.session_type,
        start_time: values.start_time, // Just send HH:mm
        end_time: values.end_time, // Just send HH:mm
        day_number: parseInt(values.day_number, 10),
        chat_mode: values.chat_mode,
        // Streaming platform fields (convert empty string to null for API)
        streaming_platform: values.streaming_platform || null,
        stream_url: values.stream_url || null,
        zoom_meeting_id: values.zoom_meeting_id || null,
        zoom_passcode: values.zoom_passcode || null,
        mux_playback_policy: values.mux_playback_policy || null,
        jitsi_room_name: values.jitsi_room_name || null,
        // Note: OTHER platform uses stream_url (sent above)
      };

      let result: { id: number };
      if (isEditing && session) {
        result = await updateSession({
          id: session.id,
          ...sessionData,
        }).unwrap();
      } else if (eventId) {
        result = await createSession({
          eventId,
          ...sessionData,
        }).unwrap();
      } else {
        throw new Error('Missing eventId for session creation');
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
      size='lg'
      lockScroll={false}
      classNames={{
        content: styles.modalContent || '',
        header: styles.modalHeader || '',
        body: styles.modalBody || '',
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap='md' p='lg'>
          <Text className={styles.sectionTitle || ''}>Basic Information</Text>

          <TextInput
            label='Session Title'
            placeholder='Enter a descriptive title for your session'
            required
            classNames={{ input: styles.formInput || '' }}
            {...form.getInputProps('title')}
          />

          <Textarea
            label='Short Description'
            placeholder='Brief description for the agenda view (max 200 characters)'
            description='This will appear in the event agenda'
            minRows={2}
            maxLength={200}
            classNames={{ input: styles.shortDescriptionTextarea || '' }}
            {...form.getInputProps('short_description')}
          />

          <Textarea
            label='Full Description'
            placeholder='Provide a detailed description for attendees'
            description='This will appear on the session detail page'
            minRows={4}
            classNames={{ input: styles.formTextarea || '' }}
            {...form.getInputProps('description')}
          />

          <Text className={styles.sectionTitle || ''}>Session Details</Text>

          <Select
            label='Session Type'
            placeholder='Select the type of session'
            data={[...SESSION_TYPES]}
            required
            allowDeselect={false}
            classNames={{ input: styles.formSelect || '' }}
            {...form.getInputProps('session_type')}
          />

          <Select
            label='Event Day'
            placeholder='Select which day this session occurs'
            data={availableDays}
            required
            allowDeselect={false}
            classNames={{ input: styles.formSelect || '' }}
            {...form.getInputProps('day_number')}
          />

          <Group grow className={styles.timeInputGroup || ''}>
            <TimeSelect
              label='Start Time'
              required
              placeholder='Select start time'
              classNames={{ input: styles.formTimeInput || '' }}
              {...form.getInputProps('start_time')}
            />

            <TimeSelect
              label='End Time'
              required
              placeholder='Select end time'
              classNames={{ input: styles.formTimeInput || '' }}
              {...form.getInputProps('end_time')}
            />
          </Group>

          <Text className={styles.sectionTitle || ''}>Streaming & Chat</Text>

          <Select
            label='Streaming Platform'
            placeholder='Select streaming platform'
            description='Choose how attendees will watch this session'
            data={[...STREAMING_PLATFORMS]}
            allowDeselect={false}
            classNames={{ input: styles.formSelect || '' }}
            {...form.getInputProps('streaming_platform')}
          />

          {/* Conditional streaming fields based on selected platform */}
          {form.values.streaming_platform === 'VIMEO' && (
            <TextInput
              label='Vimeo Video'
              placeholder='https://vimeo.com/123456789 or video ID'
              description="Paste Vimeo URL or video ID - we'll handle the rest"
              required
              classNames={{ input: styles.formInput || '' }}
              {...form.getInputProps('stream_url')}
            />
          )}

          {form.values.streaming_platform === 'MUX' && (
            <>
              <TextInput
                label='Mux Playback ID or Stream URL'
                placeholder='DS00Spx1CV902... or https://stream.mux.com/...'
                description='Paste Mux playback ID or stream URL'
                required
                classNames={{ input: styles.formInput || '' }}
                {...form.getInputProps('stream_url')}
              />
              <Select
                label='Mux Playback Policy'
                placeholder='Select playback policy'
                description='PUBLIC: Anyone can watch. SIGNED: Requires organization credentials'
                data={[...MUX_PLAYBACK_POLICIES]}
                allowDeselect={false}
                classNames={{ input: styles.formSelect || '' }}
                {...form.getInputProps('mux_playback_policy')}
              />
            </>
          )}

          {form.values.streaming_platform === 'ZOOM' && (
            <>
              <TextInput
                label='Zoom Meeting URL or ID'
                placeholder='https://zoom.us/j/123... or 123 456 7890'
                description='Paste Zoom meeting URL or meeting ID (spaces and dashes OK)'
                required
                classNames={{ input: styles.formInput || '' }}
                {...form.getInputProps('zoom_meeting_id')}
              />
              <TextInput
                label='Zoom Passcode (Optional)'
                placeholder='Meeting passcode'
                description='Add if your Zoom meeting requires a passcode'
                classNames={{ input: styles.formInput || '' }}
                {...form.getInputProps('zoom_passcode')}
              />
            </>
          )}

          {form.values.streaming_platform === 'JITSI' && (
            <TextInput
              label='Jitsi Room Name'
              placeholder='my-event-session or https://8x8.vc/...'
              description="Enter a room name or full URL - we'll normalize it for you. Requires organization JaaS credentials."
              required
              classNames={{ input: styles.formInput || '' }}
              {...form.getInputProps('jitsi_room_name')}
            />
          )}

          {form.values.streaming_platform === 'OTHER' && (
            <TextInput
              label='External Stream URL'
              placeholder='https://...'
              description='External streaming platform URL (MS Teams, custom player, etc.). Must be HTTPS.'
              required
              classNames={{ input: styles.formInput || '' }}
              {...form.getInputProps('stream_url')}
            />
          )}

          <Select
            label='Chat Settings'
            placeholder='Choose chat availability'
            data={[...CHAT_MODES]}
            required
            allowDeselect={false}
            classNames={{ input: styles.formSelect || '' }}
            {...form.getInputProps('chat_mode')}
          />

          <div className={styles.buttonGroup || ''}>
            <MantineButton variant='subtle' onClick={onClose} disabled={isLoading}>
              Cancel
            </MantineButton>
            <Button type='submit' variant='primary' loading={isLoading}>
              {isLoading ?
                isEditing ?
                  'Saving...'
                : 'Creating...'
              : isEditing ?
                'Save Changes'
              : 'Create Session'}
            </Button>
          </div>
        </Stack>
      </form>
    </Modal>
  );
};
