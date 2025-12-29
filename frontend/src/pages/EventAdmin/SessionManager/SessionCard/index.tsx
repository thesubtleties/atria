import { useState, useCallback, useEffect } from 'react';
import { TextInput, Textarea, Select, Group, Text, ActionIcon, Menu, Badge } from '@mantine/core';
import { TimeSelect } from '@/shared/components/forms/TimeSelect';
import { IconDots, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useUpdateSessionMutation, useDeleteSessionMutation } from '@/app/features/sessions/api';
import { SessionSpeakers } from '@/pages/Session/SessionSpeakers';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { cn } from '@/lib/cn';
import {
  validateField,
  validateTimeOrder,
  validateStreamUrl,
  validateZoomMeetingId,
  validateJitsiRoomName,
  type SessionFieldName,
  type SessionTypeValue,
} from '../schemas/sessionCardSchema';
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
  { value: 'JITSI', label: 'Jitsi (JaaS)' },
  { value: 'OTHER', label: 'Other' },
] as const;

const MUX_PLAYBACK_POLICIES = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'SIGNED', label: 'Signed' },
] as const;

const VISIBILITY_WINDOW_OPTIONS = [
  { value: '', label: 'Event default' },
  { value: '0', label: 'Always visible' },
  { value: '2', label: '2 min' },
  { value: '5', label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
] as const;

const VOD_PLATFORMS = [
  { value: '', label: 'Auto-detect' },
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'MUX', label: 'Mux' },
  { value: 'OTHER', label: 'Other' },
] as const;

type SessionCardProps = {
  session: Session;
  hasConflict: boolean;
};

type FieldErrors = Partial<Record<SessionFieldName | 'time_order', string>>;

export const SessionCard = ({ session, hasConflict }: SessionCardProps) => {
  const [updateSession] = useUpdateSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();

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
  const [jitsiRoomName, setJitsiRoomName] = useState(session.jitsi_room_name ?? '');

  // Visibility window and VOD fields
  const [visibilityMinutesOverride, setVisibilityMinutesOverride] = useState<string>(
    session.visibility_minutes_override != null ?
      session.visibility_minutes_override.toString()
    : '',
  );
  const [vodUrl, setVodUrl] = useState(session.vod_url ?? '');
  const [vodPlatform, setVodPlatform] = useState<StreamingPlatform | ''>(
    session.vod_platform ?? '',
  );

  const [errors, setErrors] = useState<FieldErrors>({});

  const [debouncedTitle] = useDebouncedValue(title, 500);
  const [debouncedDescription] = useDebouncedValue(description, 500);
  const [debouncedShortDescription] = useDebouncedValue(shortDescription, 500);
  const [debouncedStreamUrl] = useDebouncedValue(streamUrl, 500);
  const [debouncedZoomMeetingId] = useDebouncedValue(zoomMeetingId, 500);
  const [debouncedZoomPasscode] = useDebouncedValue(zoomPasscode, 500);
  const [debouncedJitsiRoomName] = useDebouncedValue(jitsiRoomName, 500);
  const [debouncedVodUrl] = useDebouncedValue(vodUrl, 500);

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
          jitsi_room_name?: string | null;
          short_description?: string | null;
          visibility_minutes_override?: number | null;
          vod_url?: string | null;
          vod_platform?: StreamingPlatform | null;
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
    // Normalize comparison: treat null, undefined, '' as equivalent
    const normalizedSessionDesc = session.description ?? '';
    if (debouncedDescription !== normalizedSessionDesc) {
      handleUpdate({ description: debouncedDescription || null });
    }
  }, [debouncedDescription, session.description, handleUpdate]);

  useEffect(() => {
    // Normalize comparison: treat null, undefined, '' as equivalent
    const normalizedSessionShort = session.short_description ?? '';
    if (
      debouncedShortDescription !== normalizedSessionShort &&
      validateAndUpdate('short_description', debouncedShortDescription)
    ) {
      handleUpdate({ short_description: debouncedShortDescription || null });
    }
  }, [debouncedShortDescription, session.short_description, handleUpdate, validateAndUpdate]);

  useEffect(() => {
    // Normalize comparison: treat null, undefined, '' as equivalent
    const normalizedSessionUrl = session.stream_url ?? '';
    const hasActualChange = debouncedStreamUrl !== normalizedSessionUrl;

    if (!hasActualChange) return;

    // Empty value is valid (clearing the field)
    if (debouncedStreamUrl === '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.stream_url;
        return newErrors;
      });
      handleUpdate({
        streaming_platform: (streamingPlatform || null) as StreamingPlatform | null,
        stream_url: null,
      });
      return;
    }

    // Validate with platform-aware schema
    const validation = validateStreamUrl(streamingPlatform, debouncedStreamUrl);
    if (!validation.success) {
      const zodError = validation.error as { errors: { message: string }[] };
      setErrors((prev) => ({
        ...prev,
        stream_url: zodError.errors[0]?.message ?? 'Invalid value',
      }));
      return;
    }

    // Clear error and send update
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.stream_url;
      return newErrors;
    });
    handleUpdate({
      streaming_platform: (streamingPlatform || null) as StreamingPlatform | null,
      stream_url: debouncedStreamUrl,
    });
  }, [debouncedStreamUrl, session.stream_url, streamingPlatform, handleUpdate]);

  useEffect(() => {
    // Normalize comparison: treat null, undefined, '' as equivalent
    const normalizedSessionZoom = session.zoom_meeting_id ?? '';
    const hasActualChange = debouncedZoomMeetingId !== normalizedSessionZoom;

    if (!hasActualChange) return;

    // Empty value is valid (clearing the field)
    if (debouncedZoomMeetingId === '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.zoom_meeting_id;
        return newErrors;
      });
      handleUpdate({
        streaming_platform: (streamingPlatform || null) as StreamingPlatform | null,
        zoom_meeting_id: null,
      });
      return;
    }

    // Validate with Zoom-specific schema
    const validation = validateZoomMeetingId(debouncedZoomMeetingId);
    if (!validation.success) {
      const zodError = validation.error as { errors: { message: string }[] };
      setErrors((prev) => ({
        ...prev,
        zoom_meeting_id: zodError.errors[0]?.message ?? 'Invalid value',
      }));
      return;
    }

    // Clear error and send update
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.zoom_meeting_id;
      return newErrors;
    });
    handleUpdate({
      streaming_platform: (streamingPlatform || null) as StreamingPlatform | null,
      zoom_meeting_id: debouncedZoomMeetingId,
    });
  }, [debouncedZoomMeetingId, session.zoom_meeting_id, streamingPlatform, handleUpdate]);

  useEffect(() => {
    // Normalize comparison: treat null, undefined, '' as equivalent
    const normalizedSessionPasscode = session.zoom_passcode ?? '';
    if (debouncedZoomPasscode !== normalizedSessionPasscode) {
      handleUpdate({ zoom_passcode: debouncedZoomPasscode || null });
    }
  }, [debouncedZoomPasscode, session.zoom_passcode, handleUpdate]);

  useEffect(() => {
    // Normalize comparison: treat null, undefined, '' as equivalent
    const normalizedSessionJitsi = session.jitsi_room_name ?? '';
    const hasActualChange = debouncedJitsiRoomName !== normalizedSessionJitsi;

    if (!hasActualChange) return;

    // Empty value is valid (clearing the field)
    if (debouncedJitsiRoomName === '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.jitsi_room_name;
        return newErrors;
      });
      handleUpdate({
        streaming_platform: (streamingPlatform || null) as StreamingPlatform | null,
        jitsi_room_name: null,
      });
      return;
    }

    // Validate with Jitsi-specific schema
    const validation = validateJitsiRoomName(debouncedJitsiRoomName);
    if (!validation.success) {
      const zodError = validation.error as { errors: { message: string }[] };
      setErrors((prev) => ({
        ...prev,
        jitsi_room_name: zodError.errors[0]?.message ?? 'Invalid value',
      }));
      return;
    }

    // Clear error and send update
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.jitsi_room_name;
      return newErrors;
    });
    handleUpdate({
      streaming_platform: (streamingPlatform || null) as StreamingPlatform | null,
      jitsi_room_name: debouncedJitsiRoomName,
    });
  }, [debouncedJitsiRoomName, session.jitsi_room_name, streamingPlatform, handleUpdate]);

  // Auto-save VOD URL (debounced)
  useEffect(() => {
    // Normalize comparison: treat null, undefined, '' as equivalent
    const normalizedSessionVod = session.vod_url ?? '';
    if (debouncedVodUrl !== normalizedSessionVod) {
      handleUpdate({ vod_url: debouncedVodUrl || null });
    }
  }, [debouncedVodUrl, session.vod_url, handleUpdate]);

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

  const getSessionTypeLabel = (type: string): string => {
    return SESSION_TYPES.find((t) => t.value === type)?.label ?? type;
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

  const handlePlatformChange = (value: string | null) => {
    const platformValue = value as StreamingPlatform | '';
    setStreamingPlatform(platformValue);

    if (!value || value === '') {
      // Clearing platform - reset all streaming fields and update immediately
      setStreamUrl('');
      setZoomMeetingId('');
      setZoomPasscode('');
      setMuxPlaybackPolicy('PUBLIC');
      setJitsiRoomName('');
      handleUpdate({
        streaming_platform: null,
        stream_url: null,
        zoom_meeting_id: null,
        zoom_passcode: null,
        mux_playback_policy: null,
        jitsi_room_name: null,
      });
    }
    // When selecting a platform, just set local state - the URL effect will
    // send platform+URL together when user enters the URL
  };

  return (
    <div className={cn(styles.sessionCard, hasConflict && styles.hasConflict)}>
      <div className={styles.header}>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant='unstyled'
          className={cn(styles.titleInput)}
          placeholder='Session Title'
          error={errors.title}
        />
        <Menu position='bottom-end' withinPortal>
          <Menu.Target>
            <ActionIcon variant='subtle' color='gray' className={cn(styles.actionButton)}>
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item color='red' leftSection={<IconTrash size={14} />} onClick={handleDelete}>
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>

      <div className={styles.timeBlock}>
        <Group>
          <TimeSelect
            value={startTime}
            onChange={(value) => handleTimeChange('start_time', value)}
            placeholder='Start time'
            classNames={{ input: cn(styles.formTimeInput) }}
            error={errors.start_time}
          />
          <Text size='sm' c='dimmed'>
            to
          </Text>
          <TimeSelect
            value={endTime}
            onChange={(value) => handleTimeChange('end_time', value)}
            placeholder='End time'
            classNames={{ input: cn(styles.formTimeInput) }}
            error={errors.end_time ?? errors.time_order}
          />
        </Group>

        <Group ml='auto' gap='sm'>
          <Badge className={cn(getSessionTypeBadgeClass(sessionType))} size='sm'>
            {getSessionTypeLabel(sessionType)}
          </Badge>
          <Badge className={cn(styles.durationPill)} size='sm'>
            {calculateDuration(startTime, endTime)}
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
      </div>

      <div className={styles.content}>
        {/* Type & Chat Row */}
        <div>
          <Text className={cn(styles.sectionLabel)}>Type & Chat</Text>
          <Group gap='xs'>
            <Select
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
              style={{ width: 140 }}
              classNames={{ input: cn(styles.formSelect) }}
            />
            <Select
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
              style={{ width: 160 }}
              classNames={{ input: cn(styles.formSelect) }}
            />
          </Group>
        </div>

        {/* Streaming Row */}
        <div style={{ marginTop: 12 }}>
          <Text className={cn(styles.sectionLabel)}>Streaming & Recording</Text>
          <Group gap='xs' wrap='wrap'>
            <Select
              value={streamingPlatform}
              onChange={handlePlatformChange}
              data={[...STREAMING_PLATFORMS]}
              size='sm'
              allowDeselect={false}
              style={{ width: 150 }}
              classNames={{ input: cn(styles.formSelect) }}
            />
            {streamingPlatform === 'VIMEO' && (
              <TextInput
                placeholder='Vimeo URL or video ID'
                size='sm'
                style={{ flex: 1, minWidth: 200 }}
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                error={errors.stream_url}
                classNames={{ input: cn(styles.formInput) }}
              />
            )}
            {streamingPlatform === 'MUX' && (
              <>
                <TextInput
                  placeholder='Mux Playback ID'
                  size='sm'
                  style={{ flex: 1, minWidth: 180 }}
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  error={errors.stream_url}
                  classNames={{ input: cn(styles.formInput) }}
                />
                <Select
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
                  style={{ width: 100 }}
                  classNames={{ input: cn(styles.formSelect) }}
                />
              </>
            )}
            {streamingPlatform === 'ZOOM' && (
              <>
                <TextInput
                  placeholder='Zoom meeting URL or ID'
                  size='sm'
                  style={{ flex: 1, minWidth: 180 }}
                  value={zoomMeetingId}
                  onChange={(e) => setZoomMeetingId(e.target.value)}
                  error={errors.zoom_meeting_id}
                  classNames={{ input: cn(styles.formInput) }}
                />
                <TextInput
                  placeholder='Passcode'
                  size='sm'
                  style={{ width: 120 }}
                  value={zoomPasscode}
                  onChange={(e) => setZoomPasscode(e.target.value)}
                  classNames={{ input: cn(styles.formInput) }}
                />
              </>
            )}
            {streamingPlatform === 'JITSI' && (
              <TextInput
                placeholder='Jitsi room name or URL'
                size='sm'
                style={{ flex: 1, minWidth: 200 }}
                value={jitsiRoomName}
                onChange={(e) => setJitsiRoomName(e.target.value)}
                error={errors.jitsi_room_name}
                classNames={{ input: cn(styles.formInput) }}
              />
            )}
            {streamingPlatform === 'OTHER' && (
              <TextInput
                placeholder='External stream URL'
                size='sm'
                style={{ flex: 1, minWidth: 200 }}
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                error={errors.stream_url}
                classNames={{ input: cn(styles.formInput) }}
              />
            )}
          </Group>
          {/* Recording URL - Optional, Vimeo/Mux auto-detect from stream */}
          <Group gap='xs' mt={8} wrap='wrap' align='flex-end'>
            <TextInput
              placeholder='Recording URL (optional)'
              size='sm'
              style={{ flex: 1, minWidth: 200 }}
              value={vodUrl}
              onChange={(e) => setVodUrl(e.target.value)}
              classNames={{ input: cn(styles.formInput) }}
            />
            {vodUrl && (
              <Select
                value={vodPlatform}
                onChange={(value) => {
                  const newValue = (value ?? '') as StreamingPlatform | '';
                  setVodPlatform(newValue);
                  handleUpdate({ vod_platform: newValue || null });
                }}
                data={[...VOD_PLATFORMS]}
                size='sm'
                allowDeselect={false}
                style={{ width: 120 }}
                classNames={{ input: cn(styles.formSelect) }}
              />
            )}
          </Group>
          {(streamingPlatform === 'VIMEO' || streamingPlatform === 'MUX') && !vodUrl && (
            <Text size='xs' c='dimmed' mt={4}>
              Vimeo/Mux will use stream URL for recording if left blank
            </Text>
          )}
        </div>

        {/* Visibility Window */}
        <div style={{ marginTop: 12 }}>
          <Text className={cn(styles.sectionLabel)}>Access Window</Text>
          <Text size='xs' c='dimmed' mb={6}>
            Buffer time before and after session when stream and chat are accessible
          </Text>
          <Select
            value={visibilityMinutesOverride}
            onChange={(value) => {
              const newValue = value ?? '';
              setVisibilityMinutesOverride(newValue);
              handleUpdate({
                visibility_minutes_override: newValue === '' ? null : parseInt(newValue, 10),
              });
            }}
            data={[...VISIBILITY_WINDOW_OPTIONS]}
            size='sm'
            allowDeselect={false}
            style={{ width: 160 }}
            classNames={{ input: cn(styles.formSelect) }}
          />
        </div>

        <div className={styles.speakersSection}>
          {(() => {
            const speakers = (session as { speakers?: SessionSpeaker[] }).speakers;
            if (!speakers) {
              return (
                <SessionSpeakers
                  sessionId={session.id}
                  eventId={session.event_id}
                  canEdit={true}
                  variant='flow'
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
                variant='flow'
                preloadedSpeakers={convertedSpeakers}
              />
            );
          })()}
        </div>

        {/* Descriptions */}
        <div style={{ marginTop: 12 }}>
          <Text className={cn(styles.sectionLabel)}>Short Description (Agenda)</Text>
          <Textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder='Brief summary shown in the schedule (max 200 characters)'
            maxLength={200}
            autosize
            minRows={1}
            maxRows={3}
            size='sm'
            error={errors.short_description}
            classNames={{ input: cn(styles.formTextarea) }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <Text className={cn(styles.sectionLabel)}>Full Description</Text>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Detailed description shown on the session page'
            autosize
            minRows={2}
            maxRows={6}
            classNames={{ input: cn(styles.formTextarea) }}
            className={cn(styles.descriptionTextarea)}
          />
        </div>
      </div>
    </div>
  );
};
