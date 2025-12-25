import { useState, useCallback, useEffect, useRef } from 'react';
import {
  TextInput,
  Textarea,
  Select,
  Group,
  Text,
  ActionIcon,
  Menu,
  Badge,
  Collapse,
  Stack,
} from '@mantine/core';
import { TimeSelect } from '@/shared/components/forms/TimeSelect';
import {
  IconDots,
  IconTrash,
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconClock,
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useUpdateSessionMutation, useDeleteSessionMutation } from '@/app/features/sessions/api';
import { SessionSpeakers } from '@/pages/Session/SessionSpeakers';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { cn } from '@/lib/cn';
import {
  validateField,
  validateTimeOrder,
  type SessionFieldName,
  type SessionTypeValue,
} from '../schemas/sessionCardSchema';
import { formatTime } from '@/shared/utils/formatting';
import type { Session, StreamingPlatform, SessionSpeaker } from '@/types';
import type { SessionType, SessionChatMode, SessionStatus } from '@/types/enums';
import styles from '../styles/index.module.css';

const SESSION_TYPES = [
  { value: 'KEYNOTE', label: 'Keynote' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'PANEL', label: 'Panel' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'QA', label: 'Q&A' },
] as const;

const CHAT_MODES = [
  { value: 'ENABLED', label: 'All Chat Enabled' },
  { value: 'BACKSTAGE_ONLY', label: 'Backstage Only' },
  { value: 'DISABLED', label: 'Chat Disabled' },
] as const;

const STREAMING_PLATFORMS = [
  { value: '', label: 'No Streaming' },
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'MUX', label: 'Mux' },
  { value: 'ZOOM', label: 'Zoom' },
] as const;

const MUX_PLAYBACK_POLICIES = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'SIGNED', label: 'Signed' },
] as const;

type SessionCardMobileProps = {
  session: Session;
  hasConflict: boolean;
};

type FieldErrors = Partial<Record<SessionFieldName | 'time_order', string>>;

export const SessionCardMobile = ({ session, hasConflict }: SessionCardMobileProps) => {
  const [updateSession] = useUpdateSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description ?? '');
  const [shortDescription, setShortDescription] = useState(session.short_description ?? '');
  const [sessionType, setSessionType] = useState<SessionTypeValue>(
    session.session_type as SessionTypeValue,
  );
  const [startTime, setStartTime] = useState(session.start_time);
  const [endTime, setEndTime] = useState(session.end_time);
  const [chatMode, setChatMode] = useState<SessionChatMode>(session.chat_mode ?? 'ENABLED');

  const [streamingPlatform, setStreamingPlatform] = useState<StreamingPlatform | ''>(
    session.streaming_platform ?? '',
  );
  const [streamUrl, setStreamUrl] = useState(session.stream_url ?? '');
  const [zoomMeetingId, setZoomMeetingId] = useState(session.zoom_meeting_id ?? '');
  const [zoomPasscode, setZoomPasscode] = useState(session.zoom_passcode ?? '');
  const [muxPlaybackPolicy, setMuxPlaybackPolicy] = useState(
    session.mux_playback_policy ?? 'PUBLIC',
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const pendingPlatformChangeRef = useRef(false);

  const [debouncedTitle] = useDebouncedValue(title, 500);
  const [debouncedDescription] = useDebouncedValue(description, 500);
  const [debouncedShortDescription] = useDebouncedValue(shortDescription, 500);
  const [debouncedStreamUrl] = useDebouncedValue(streamUrl, 500);
  const [debouncedZoomMeetingId] = useDebouncedValue(zoomMeetingId, 500);
  const [debouncedZoomPasscode] = useDebouncedValue(zoomPasscode, 500);

  const handleUpdate = useCallback(
    async (updates: Partial<Session>) => {
      try {
        const updateParams: {
          id: number;
          title?: string;
          description?: string;
          session_type?: SessionType;
          chat_mode?: SessionChatMode;
          status?: SessionStatus;
          start_time?: string;
          end_time?: string;
          streaming_platform?: StreamingPlatform | null;
          stream_url?: string | null;
          zoom_meeting_id?: string | null;
          zoom_passcode?: string | null;
          mux_playback_policy?: string | null;
        } = {
          id: session.id,
          ...Object.fromEntries(
            Object.entries(updates).map(([key, value]) => [
              key,
              value === null ? undefined : value,
            ]),
          ),
        } as typeof updateParams;
        await updateSession(updateParams).unwrap();
      } catch {
        notifications.show({ title: 'Error', message: 'Failed to update session', color: 'red' });
      }
    },
    [session.id, updateSession],
  );

  const validateAndUpdate = useCallback((field: SessionFieldName, value: unknown): boolean => {
    const validation = validateField(field, value);
    if (!validation.success) {
      const zodError = validation.error as { errors: { message: string }[] };
      setErrors((prev) => ({ ...prev, [field]: zodError.errors[0]?.message }));
      return false;
    }
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    return true;
  }, []);

  useEffect(() => {
    if (debouncedTitle !== session.title && validateAndUpdate('title', debouncedTitle)) {
      handleUpdate({ title: debouncedTitle });
    }
  }, [debouncedTitle, session.title, handleUpdate, validateAndUpdate]);

  useEffect(() => {
    if (debouncedDescription !== session.description) {
      handleUpdate({ description: debouncedDescription || null });
    }
  }, [debouncedDescription, session.description, handleUpdate]);

  useEffect(() => {
    if (
      debouncedShortDescription !== session.short_description &&
      validateAndUpdate('short_description', debouncedShortDescription)
    ) {
      handleUpdate({ short_description: debouncedShortDescription || null });
    }
  }, [debouncedShortDescription, session.short_description, handleUpdate, validateAndUpdate]);

  useEffect(() => {
    if (
      debouncedStreamUrl !== session.stream_url &&
      (debouncedStreamUrl === '' || validateAndUpdate('stream_url', debouncedStreamUrl))
    ) {
      if (pendingPlatformChangeRef.current) {
        handleUpdate({
          streaming_platform: (streamingPlatform || null) as StreamingPlatform | null,
          stream_url: debouncedStreamUrl || null,
        });
        pendingPlatformChangeRef.current = false;
      } else {
        handleUpdate({ stream_url: debouncedStreamUrl || null });
      }
    }
  }, [debouncedStreamUrl, session.stream_url, streamingPlatform, handleUpdate, validateAndUpdate]);

  useEffect(() => {
    if (
      debouncedZoomMeetingId !== session.zoom_meeting_id &&
      (debouncedZoomMeetingId === '' ||
        validateAndUpdate('zoom_meeting_id', debouncedZoomMeetingId))
    ) {
      if (pendingPlatformChangeRef.current) {
        handleUpdate({
          streaming_platform: (streamingPlatform || null) as StreamingPlatform | null,
          zoom_meeting_id: debouncedZoomMeetingId || null,
        });
        pendingPlatformChangeRef.current = false;
      } else {
        handleUpdate({ zoom_meeting_id: debouncedZoomMeetingId || null });
      }
    }
  }, [
    debouncedZoomMeetingId,
    session.zoom_meeting_id,
    streamingPlatform,
    handleUpdate,
    validateAndUpdate,
  ]);

  useEffect(() => {
    if (debouncedZoomPasscode !== session.zoom_passcode) {
      handleUpdate({ zoom_passcode: debouncedZoomPasscode || null });
    }
  }, [debouncedZoomPasscode, session.zoom_passcode, handleUpdate]);

  const calculateDuration = (start: string, end: string): string => {
    const startParts = start.split(':').map(Number);
    const endParts = end.split(':').map(Number);
    const totalMinutes =
      (endParts[0] ?? 0) * 60 +
      (endParts[1] ?? 0) -
      ((startParts[0] ?? 0) * 60 + (startParts[1] ?? 0));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string | null) => {
    if (!value) return;
    if (!validateAndUpdate(field, value)) return;
    if (field === 'start_time') setStartTime(value);
    else setEndTime(value);

    const newStartTime = field === 'start_time' ? value : startTime;
    const newEndTime = field === 'end_time' ? value : endTime;
    const timeOrderValidation = validateTimeOrder(newStartTime, newEndTime);

    if (!timeOrderValidation.success) {
      setErrors((prev) => ({ ...prev, time_order: timeOrderValidation.error?.message ?? '' }));
      return;
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.time_order;
      return newErrors;
    });

    const updates =
      errors.time_order ? { start_time: newStartTime, end_time: newEndTime } : { [field]: value };
    handleUpdate(updates);
  };

  const handleDelete = () => {
    openConfirmationModal({
      title: 'Delete Session',
      message: `Are you sure you want to delete "${session.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDangerous: true,
      children: null,
      onConfirm: async () => {
        try {
          await deleteSession({ id: session.id }).unwrap();
          notifications.show({
            title: 'Success',
            message: 'Session deleted successfully',
            color: 'green',
          });
        } catch {
          notifications.show({ title: 'Error', message: 'Failed to delete session', color: 'red' });
        }
      },
    });
  };

  const getSessionTypeLabel = (type: string): string =>
    SESSION_TYPES.find((t) => t.value === type)?.label ?? type;

  const getSessionTypeBadgeClass = (type: string): string => {
    const typeClassMap: Record<string, string | undefined> = {
      KEYNOTE: styles.badgeKeynote,
      WORKSHOP: styles.badgeWorkshop,
      PANEL: styles.badgePanel,
      PRESENTATION: styles.badgePresentation,
      NETWORKING: styles.badgeNetworking,
      QA: styles.badgeQa,
    };
    return typeClassMap[type] ?? styles.sessionTypeBadge ?? '';
  };

  return (
    <div className={cn(styles.sessionCard, hasConflict && styles.hasConflict)}>
      <Menu position='bottom-end' withinPortal>
        <Menu.Target>
          <ActionIcon
            variant='subtle'
            color='gray'
            className={cn(styles.mobileActionButton)}
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              opacity: 1,
              visibility: 'visible',
            }}
          >
            <IconDots size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item color='red' leftSection={<IconTrash size={14} />} onClick={handleDelete}>
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Stack gap='xs'>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant='unstyled'
          className={cn(styles.titleInput)}
          placeholder='Session Title'
          error={errors.title}
          style={{ paddingRight: '2.5rem' }}
        />

        <Group justify='space-between' wrap='nowrap'>
          <div className={styles.mobileTimeDisplay}>
            <IconClock size={16} />
            <Text size='sm'>
              {formatTime(startTime)} - {formatTime(endTime)}
            </Text>
            <Badge size='sm' className={cn(styles.durationPill)}>
              {calculateDuration(startTime, endTime)}
            </Badge>
          </div>
        </Group>

        <Group gap='xs'>
          <Badge className={cn(getSessionTypeBadgeClass(sessionType))} size='sm'>
            {getSessionTypeLabel(sessionType)}
          </Badge>
          {hasConflict && (
            <Badge
              className={cn(styles.conflictPill)}
              size='sm'
              leftSection={<IconAlertCircle size={12} />}
            >
              Overlaps
            </Badge>
          )}
        </Group>

        <div
          className={styles.expandableSection}
          onClick={() => setDetailsExpanded(!detailsExpanded)}
        >
          <Group justify='space-between' wrap='nowrap'>
            <Text size='sm' fw={500}>
              Session Details
            </Text>
            <ActionIcon
              size='xs'
              variant='transparent'
              style={{ color: 'var(--color-text-muted)' }}
            >
              {detailsExpanded ?
                <IconChevronUp size={14} />
              : <IconChevronDown size={14} />}
            </ActionIcon>
          </Group>
        </div>
      </Stack>

      <Collapse in={detailsExpanded}>
        <div className={styles.collapsedContent}>
          <Stack gap='md' mt='md'>
            <Group grow>
              <TimeSelect
                value={startTime}
                onChange={(value) => handleTimeChange('start_time', value)}
                placeholder='Start time'
                label='Start Time'
                error={errors.start_time}
                size='sm'
                classNames={{ input: cn(styles.formTimeInput) }}
              />
              <TimeSelect
                value={endTime}
                onChange={(value) => handleTimeChange('end_time', value)}
                placeholder='End time'
                label='End Time'
                error={errors.end_time ?? errors.time_order}
                size='sm'
                classNames={{ input: cn(styles.formTimeInput) }}
              />
            </Group>

            <Select
              label='Session Type'
              value={sessionType}
              onChange={(value) => {
                if (value) {
                  const typedValue = value as SessionTypeValue;
                  setSessionType(typedValue);
                  handleUpdate({ session_type: typedValue as SessionType });
                }
              }}
              data={[...SESSION_TYPES]}
              size='sm'
              allowDeselect={false}
              classNames={{ input: cn(styles.formSelect) }}
            />

            <Select
              label='Chat Mode'
              value={chatMode}
              onChange={(value) => {
                if (value) {
                  setChatMode(value as SessionChatMode);
                  handleUpdate({ chat_mode: value as SessionChatMode });
                }
              }}
              data={[...CHAT_MODES]}
              size='sm'
              allowDeselect={false}
              classNames={{ input: cn(styles.formSelect) }}
            />

            <Select
              label='Streaming Platform'
              placeholder='Select platform'
              value={streamingPlatform}
              onChange={(value) => {
                const platformValue = value as StreamingPlatform | '';
                setStreamingPlatform(platformValue);
                if (!value || value === '') {
                  setStreamUrl('');
                  setZoomMeetingId('');
                  setZoomPasscode('');
                  setMuxPlaybackPolicy('PUBLIC');
                  handleUpdate({
                    streaming_platform: null,
                    stream_url: null,
                    zoom_meeting_id: null,
                    zoom_passcode: null,
                    mux_playback_policy: null,
                  });
                  pendingPlatformChangeRef.current = false;
                } else {
                  pendingPlatformChangeRef.current = true;
                }
              }}
              data={[...STREAMING_PLATFORMS]}
              size='sm'
              allowDeselect={false}
              classNames={{ input: cn(styles.formSelect) }}
            />

            {streamingPlatform === 'VIMEO' && (
              <TextInput
                label='Vimeo URL or Video ID'
                placeholder='https://vimeo.com/123... or ID'
                size='sm'
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                error={errors.stream_url}
                classNames={{ input: cn(styles.formInput) }}
              />
            )}

            {streamingPlatform === 'MUX' && (
              <>
                <TextInput
                  label='Mux Playback ID or URL'
                  placeholder='DS00Spx1CV902...'
                  size='sm'
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  error={errors.stream_url}
                  classNames={{ input: cn(styles.formInput) }}
                />
                <Select
                  label='Mux Playback Policy'
                  value={muxPlaybackPolicy}
                  onChange={(value) => {
                    if (value === 'PUBLIC' || value === 'SIGNED') {
                      setMuxPlaybackPolicy(value);
                      handleUpdate({ mux_playback_policy: value });
                    }
                  }}
                  data={[...MUX_PLAYBACK_POLICIES]}
                  size='sm'
                  allowDeselect={false}
                  classNames={{ input: cn(styles.formSelect) }}
                />
              </>
            )}

            {streamingPlatform === 'ZOOM' && (
              <>
                <TextInput
                  label='Zoom Meeting URL or ID'
                  placeholder='https://zoom.us/j/123... or ID'
                  size='sm'
                  value={zoomMeetingId}
                  onChange={(e) => setZoomMeetingId(e.target.value)}
                  error={errors.zoom_meeting_id}
                  classNames={{ input: cn(styles.formInput) }}
                />
                <TextInput
                  label='Passcode (Optional)'
                  placeholder='Meeting passcode'
                  size='sm'
                  value={zoomPasscode}
                  onChange={(e) => setZoomPasscode(e.target.value)}
                  classNames={{ input: cn(styles.formInput) }}
                />
              </>
            )}

            <div className={styles.speakersSection}>
              <Text size='sm' fw={500} mb='xs'>
                Speakers
              </Text>
              {(() => {
                const speakers = (session as { session_speakers?: SessionSpeaker[] })
                  .session_speakers;
                if (!speakers) {
                  return (
                    <SessionSpeakers
                      sessionId={session.id}
                      eventId={session.event_id}
                      canEdit={true}
                    />
                  );
                }
                // Convert API SessionSpeaker type to component's expected format
                const convertedSpeakers = speakers.map((speaker) => {
                  const converted: {
                    user_id: number;
                    role: string;
                    speaker_name?: string;
                    full_name?: string;
                    title?: string;
                    company_name?: string;
                    speaker_bio?: string;
                    image_url?: string;
                    social_links?: {
                      linkedin?: string;
                      website?: string;
                    };
                    user?: {
                      id: number;
                    };
                  } = {
                    user_id: speaker.user_id,
                    role: speaker.role,
                  };
                  if (speaker.speaker_name) converted.speaker_name = speaker.speaker_name;
                  if (speaker.speaker_name) converted.full_name = speaker.speaker_name;
                  if (speaker.title) converted.title = speaker.title;
                  if (speaker.company_name) converted.company_name = speaker.company_name;
                  if (speaker.image_url) converted.image_url = speaker.image_url;
                  if (speaker.social_links) {
                    converted.social_links = {};
                    if (speaker.social_links.linkedin)
                      converted.social_links.linkedin = speaker.social_links.linkedin;
                    if (speaker.social_links.website)
                      converted.social_links.website = speaker.social_links.website;
                  }
                  return converted;
                });
                return (
                  <SessionSpeakers
                    sessionId={session.id}
                    eventId={session.event_id}
                    canEdit={true}
                    preloadedSpeakers={convertedSpeakers}
                  />
                );
              })()}
            </div>

            <Textarea
              label='Short Description'
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder='Brief description for agenda (max 200 characters)'
              maxLength={200}
              autosize
              minRows={2}
              maxRows={3}
              size='sm'
              error={errors.short_description}
              classNames={{ input: cn(styles.formTextarea) }}
            />

            <Textarea
              label='Full Description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Detailed session description'
              autosize
              minRows={3}
              maxRows={6}
              size='sm'
              classNames={{ input: cn(styles.formTextarea) }}
            />
          </Stack>
        </div>
      </Collapse>
    </div>
  );
};
