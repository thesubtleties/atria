import { useEffect, useMemo } from 'react';
import { TextInput, Stack, Modal, Textarea, Select, Group, Text, Switch } from '@mantine/core';
import { skipToken } from '@reduxjs/toolkit/query';
import { TimeSelect } from '@/shared/components/forms/TimeSelect';
import { useForm, zodResolver } from '@mantine/form';
import { useCreateSessionMutation, useUpdateSessionMutation } from '@/app/features/sessions/api';
import { parseDateOnly } from '@/shared/hooks/formatDate';
import { useGetEventQuery } from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import { editSessionSchema } from './schemas/editSessionSchema';
import styles from './styles/index.module.css';
import type { SessionType, SessionChatMode, StreamingPlatform } from '@/types/enums';

interface SessionData {
  id: number;
  event_id: number;
  title: string;
  short_description?: string | null;
  description?: string | null;
  session_type: SessionType;
  start_time: string;
  end_time: string;
  day_number: number;
  chat_mode?: SessionChatMode;
  streaming_platform?: StreamingPlatform | null;
  stream_url?: string | null;
  zoom_meeting_id?: string | null;
  zoom_passcode?: string | null;
  mux_playback_policy?: 'PUBLIC' | 'SIGNED' | null;
  jitsi_room_name?: string | null;
  // Visibility window fields
  visibility_minutes_override?: number | null;
  // VOD fields
  vod_url?: string | null;
  vod_platform?: StreamingPlatform | null;
  // Stream mode and visibility toggles
  stream_mode?: 'NONE' | 'LIVE' | 'VOD';
  show_video?: boolean;
  show_recording?: boolean;
}

interface EventData {
  id: number;
  start_date: string;
  end_date: string;
  organization?: {
    id: number;
    name: string;
    has_mux_credentials: boolean;
    has_mux_signing_credentials: boolean;
    has_jaas_credentials: boolean;
  };
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

// Stream mode: NONE (no video), LIVE (live stream), VOD (pre-recorded)
const STREAM_MODES = [
  { value: 'NONE', label: 'No Video' },
  { value: 'LIVE', label: 'Live Stream' },
  { value: 'VOD', label: 'Pre-recorded (VOD)' },
] as const;

// Platforms available for Live mode (all platforms)
const LIVE_STREAMING_PLATFORMS = [
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'MUX', label: 'Mux Video' },
  { value: 'ZOOM', label: 'Zoom Meeting' },
  { value: 'JITSI', label: 'Jitsi Meet (JaaS)' },
  { value: 'OTHER', label: 'Other (External Link)' },
] as const;

// Platforms available for VOD mode (no Zoom/Jitsi)
const VOD_STREAMING_PLATFORMS = [
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'MUX', label: 'Mux Video' },
  { value: 'OTHER', label: 'Other (External Link)' },
] as const;

const MUX_PLAYBACK_POLICIES = [
  { value: 'PUBLIC', label: 'Public (Anyone with link)' },
  { value: 'SIGNED', label: 'Signed (Requires authentication)' },
] as const;

// Visibility window options (stored as integer minutes, NULL = use event default)
const VISIBILITY_WINDOW_OPTIONS = [
  { value: '', label: 'Use event default' }, // NULL - use event-level setting
  { value: '0', label: 'Always visible' }, // 0 = always on
  { value: '2', label: '2 minutes before/after' },
  { value: '5', label: '5 minutes before/after' },
  { value: '10', label: '10 minutes before/after' },
  { value: '15', label: '15 minutes before/after' },
] as const;

// VOD platform options (for post-session recording)
const VOD_PLATFORMS = [
  { value: '', label: 'Auto-detect from stream' }, // NULL - use streaming platform
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'MUX', label: 'Mux Video' },
  { value: 'OTHER', label: 'Other (External Link)' },
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
  session_type: SessionType;
  start_time: string;
  end_time: string;
  day_number: string;
  chat_mode: SessionChatMode;
  streaming_platform: StreamingPlatform | '';
  stream_url: string;
  zoom_meeting_id: string;
  zoom_passcode: string;
  mux_playback_policy: 'PUBLIC' | 'SIGNED';
  jitsi_room_name: string;
  // Visibility window (stored as string for Select, converted to int on submit)
  visibility_minutes_override: string;
  // VOD fields
  vod_url: string;
  vod_platform: StreamingPlatform | '';
  // Stream mode and visibility toggles
  stream_mode: 'NONE' | 'LIVE' | 'VOD';
  show_video: boolean;
  show_recording: boolean;
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

  // Filter platform lists based on organization credentials
  const hasMux = event?.organization?.has_mux_credentials ?? false;
  const hasJitsi = event?.organization?.has_jaas_credentials ?? false;

  const filteredLivePlatforms = useMemo(() => {
    return LIVE_STREAMING_PLATFORMS.filter((p) => {
      if (p.value === 'MUX' && !hasMux) return false;
      if (p.value === 'JITSI' && !hasJitsi) return false;
      return true;
    });
  }, [hasMux, hasJitsi]);

  const filteredVodPlatforms = useMemo(() => {
    return VOD_STREAMING_PLATFORMS.filter((p) => {
      if (p.value === 'MUX' && !hasMux) return false;
      return true;
    });
  }, [hasMux]);

  const filteredVodRecordingPlatforms = useMemo(() => {
    return VOD_PLATFORMS.filter((p) => {
      if (p.value === 'MUX' && !hasMux) return false;
      return true;
    });
  }, [hasMux]);

  const hasMissingPlatforms = !hasMux || !hasJitsi;

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
        // Visibility window: null = use event default (empty string in form)
        visibility_minutes_override:
          session.visibility_minutes_override != null ?
            session.visibility_minutes_override.toString()
          : '',
        // VOD fields
        vod_url: session.vod_url || '',
        vod_platform: session.vod_platform || '',
        // Stream mode and visibility toggles
        stream_mode: session.stream_mode || 'NONE',
        show_video: session.show_video ?? true,
        show_recording: session.show_recording ?? true,
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
      visibility_minutes_override: '', // Empty = use event default
      vod_url: '',
      vod_platform: '',
      // Stream mode and visibility toggles
      stream_mode: 'NONE',
      show_video: true,
      show_recording: true,
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

  // Clear streaming fields when stream mode changes to NONE or platform is cleared
  useEffect(() => {
    if (form.values.stream_mode === 'NONE' || !form.values.streaming_platform) {
      // Clear all streaming fields when mode is NONE or platform is cleared
      form.setFieldValue('stream_url', '');
      form.setFieldValue('zoom_meeting_id', '');
      form.setFieldValue('zoom_passcode', '');
      form.setFieldValue('mux_playback_policy', 'PUBLIC');
      form.setFieldValue('jitsi_room_name', '');
    }
    // Also clear platform when stream mode is NONE
    if (form.values.stream_mode === 'NONE' && form.values.streaming_platform) {
      form.setFieldValue('streaming_platform', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.stream_mode, form.values.streaming_platform]);

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
        // Stream mode and visibility toggles
        stream_mode: values.stream_mode,
        show_video: values.show_video,
        show_recording: values.show_recording,
        // Streaming platform fields (convert empty string to null for API)
        streaming_platform: values.streaming_platform || null,
        stream_url: values.stream_url || null,
        zoom_meeting_id: values.zoom_meeting_id || null,
        zoom_passcode: values.zoom_passcode || null,
        mux_playback_policy: values.mux_playback_policy || null,
        jitsi_room_name: values.jitsi_room_name || null,
        // Visibility window: empty string → null (use event default), otherwise parse int
        visibility_minutes_override:
          values.visibility_minutes_override === '' ?
            null
          : parseInt(values.visibility_minutes_override, 10),
        // VOD fields
        vod_url: values.vod_url || null,
        vod_platform: values.vod_platform || null,
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

          <Text className={styles.sectionTitle || ''}>Chat Settings</Text>

          <Select
            label='Chat Mode'
            placeholder='Choose chat availability'
            data={[...CHAT_MODES]}
            required
            allowDeselect={false}
            classNames={{ input: styles.formSelect || '' }}
            {...form.getInputProps('chat_mode')}
          />

          <Select
            label='Visibility Window'
            placeholder='When attendees can access this session'
            description='Controls when video and chat become available relative to session times'
            data={[...VISIBILITY_WINDOW_OPTIONS]}
            allowDeselect={false}
            classNames={{ input: styles.formSelect || '' }}
            {...form.getInputProps('visibility_minutes_override')}
          />

          <Text className={styles.sectionTitle || ''}>Video & Streaming</Text>

          <Select
            label='Stream Mode'
            placeholder='Select how this session will be delivered'
            description='Choose whether this session has video content'
            data={[...STREAM_MODES]}
            allowDeselect={false}
            classNames={{ input: styles.formSelect || '' }}
            {...form.getInputProps('stream_mode')}
          />

          {/* Show video toggle - only when stream mode is not NONE */}
          {form.values.stream_mode !== 'NONE' && (
            <Switch
              label='Show Video'
              description='When disabled, video is hidden but configuration is preserved'
              color='var(--color-primary)'
              styles={{
                track: { cursor: 'pointer' },
              }}
              {...form.getInputProps('show_video', { type: 'checkbox' })}
            />
          )}

          {/* Platform selector - only for LIVE and VOD modes */}
          {form.values.stream_mode !== 'NONE' && (
            <Select
              label='Streaming Platform'
              placeholder='Select streaming platform'
              description='Choose the platform for your video content'
              data={
                form.values.stream_mode === 'VOD' ? filteredVodPlatforms : filteredLivePlatforms
              }
              allowDeselect={false}
              classNames={{ input: styles.formSelect || '' }}
              {...form.getInputProps('streaming_platform')}
            />
          )}

          {/* Hint when some platforms are unavailable */}
          {hasMissingPlatforms && (
            <Text size='xs' c='dimmed'>
              More platforms available via Organization settings
            </Text>
          )}

          {/* Conditional streaming fields based on selected platform */}
          {form.values.stream_mode !== 'NONE' && form.values.streaming_platform === 'VIMEO' && (
            <TextInput
              label={
                form.values.stream_mode === 'VOD' ?
                  'Vimeo Video URL or ID'
                : 'Vimeo Stream URL or ID'
              }
              placeholder='https://vimeo.com/123456789 or video ID'
              description="Paste Vimeo URL or video ID - we'll handle the rest"
              required
              classNames={{ input: styles.formInput || '' }}
              {...form.getInputProps('stream_url')}
            />
          )}

          {form.values.stream_mode !== 'NONE' && form.values.streaming_platform === 'MUX' && (
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

          {form.values.stream_mode !== 'NONE' && form.values.streaming_platform === 'ZOOM' && (
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

          {form.values.stream_mode !== 'NONE' && form.values.streaming_platform === 'JITSI' && (
            <TextInput
              label='Jitsi Room Name'
              placeholder='my-event-session or https://8x8.vc/...'
              description="Enter a room name or full URL - we'll normalize it for you. Requires organization JaaS credentials."
              required
              classNames={{ input: styles.formInput || '' }}
              {...form.getInputProps('jitsi_room_name')}
            />
          )}

          {form.values.stream_mode !== 'NONE' && form.values.streaming_platform === 'OTHER' && (
            <TextInput
              label='External Stream URL'
              placeholder='https://...'
              description='External streaming platform URL (MS Teams, custom player, etc.). Must be HTTPS.'
              required
              classNames={{ input: styles.formInput || '' }}
              {...form.getInputProps('stream_url')}
            />
          )}

          {/* Show recording toggle - only for LIVE mode with a platform selected */}
          {form.values.stream_mode === 'LIVE' && form.values.streaming_platform && (
            <Switch
              label='Show Recording After Session'
              description='Make a recording available after the live session ends'
              color='var(--color-primary)'
              styles={{
                track: { cursor: 'pointer' },
              }}
              {...form.getInputProps('show_recording', { type: 'checkbox' })}
            />
          )}

          {/* Recording section - only show for LIVE mode when show_recording is enabled */}
          {form.values.stream_mode === 'LIVE' &&
            form.values.show_recording &&
            form.values.streaming_platform && (
              <>
                <Text className={styles.sectionTitle || ''}>Recording</Text>

                <TextInput
                  label='Recording URL (Optional)'
                  placeholder='https://vimeo.com/... or Mux playback ID'
                  description='Leave blank to use the stream URL for recording. Add a different URL if needed.'
                  classNames={{ input: styles.formInput || '' }}
                  {...form.getInputProps('vod_url')}
                />

                {form.values.vod_url && (
                  <Select
                    label='Recording Platform'
                    placeholder='Select platform for the recording'
                    description='Leave as auto-detect to use the same platform as the live stream'
                    data={filteredVodRecordingPlatforms}
                    allowDeselect={false}
                    classNames={{ input: styles.formSelect || '' }}
                    {...form.getInputProps('vod_platform')}
                  />
                )}
              </>
            )}

          <div className={styles.buttonGroup || ''}>
            <Button variant='secondary' onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
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
