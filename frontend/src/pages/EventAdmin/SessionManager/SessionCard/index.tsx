import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  TextInput,
  Textarea,
  Select,
  Group,
  Text,
  ActionIcon,
  Menu,
  Badge,
  Switch,
} from '@mantine/core';
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
  type SessionFieldName,
  type SessionTypeValue,
} from '../schemas/sessionCardSchema';
import { useSessionStreaming } from '../hooks';
import type { AvailablePlatforms } from '../SessionList';
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

// Stream mode: NONE (no video), LIVE (live stream), VOD (pre-recorded)
const STREAM_MODES = [
  { value: 'NONE', label: 'No Video' },
  { value: 'LIVE', label: 'Live Stream' },
  { value: 'VOD', label: 'Pre-recorded (VOD)' },
] as const;

// Platforms available for Live mode (all platforms)
const LIVE_STREAMING_PLATFORMS = [
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'MUX', label: 'Mux' },
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'JITSI', label: 'Jitsi (JaaS)' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Platforms available for VOD mode (no Zoom/Jitsi)
const VOD_STREAMING_PLATFORMS = [
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'MUX', label: 'Mux' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Recording platform options (for post-live recording URL)
const RECORDING_PLATFORMS = [
  { value: '', label: 'Auto-detect' },
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'MUX', label: 'Mux' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Memoized styles for Switch components (prevents re-renders from inline objects)
const SWITCH_STYLES_COMPACT = {
  label: { fontSize: '0.75rem', color: 'var(--mantine-color-dimmed)', paddingLeft: 6 },
  track: { cursor: 'pointer' },
} as const;

const SWITCH_STYLES_REGULAR = {
  label: { fontSize: '0.85rem' },
  track: { cursor: 'pointer' },
} as const;

type SessionCardProps = {
  session: Session;
  hasConflict: boolean;
  availablePlatforms: AvailablePlatforms;
};

type FieldErrors = Partial<Record<SessionFieldName | 'time_order', string>>;

export const SessionCard = ({ session, hasConflict, availablePlatforms }: SessionCardProps) => {
  const [updateSession] = useUpdateSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();

  // Non-streaming state
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description ?? '');
  const [shortDescription, setShortDescription] = useState(session.short_description ?? '');
  const [sessionType, setSessionType] = useState<SessionTypeValue>(
    session.session_type as SessionTypeValue,
  );
  const [startTime, setStartTime] = useState(session.start_time);
  const [endTime, setEndTime] = useState(session.end_time);
  const [chatMode, setChatMode] = useState<SessionChatMode>(session.chat_mode ?? 'ENABLED');
  const [visibilityMinutesOverride, setVisibilityMinutesOverride] = useState<string>(
    session.visibility_minutes_override != null ?
      session.visibility_minutes_override.toString()
    : '',
  );

  const [errors, setErrors] = useState<FieldErrors>({});

  const [debouncedTitle] = useDebouncedValue(title, 500);
  const [debouncedDescription] = useDebouncedValue(description, 500);
  const [debouncedShortDescription] = useDebouncedValue(shortDescription, 500);

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

  // Use the streaming hook for all streaming-related state and validation
  const streaming = useSessionStreaming({ session, onUpdate: handleUpdate });

  // Filter platform options based on organization credentials
  const filteredLivePlatforms = useMemo(() => {
    return LIVE_STREAMING_PLATFORMS.filter((p) => {
      if (p.value === 'MUX' && !availablePlatforms.hasMux) return false;
      if (p.value === 'JITSI' && !availablePlatforms.hasJitsi) return false;
      return true;
    });
  }, [availablePlatforms]);

  const filteredVodPlatforms = useMemo(() => {
    return VOD_STREAMING_PLATFORMS.filter((p) => {
      if (p.value === 'MUX' && !availablePlatforms.hasMux) return false;
      return true;
    });
  }, [availablePlatforms]);

  const filteredRecordingPlatforms = useMemo(() => {
    return RECORDING_PLATFORMS.filter((p) => {
      if (p.value === 'MUX' && !availablePlatforms.hasMux) return false;
      return true;
    });
  }, [availablePlatforms]);

  // Merge streaming errors with component errors for display
  const allErrors = { ...errors, ...streaming.streamingErrors };

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
    const normalizedSessionDesc = session.description ?? '';
    if (debouncedDescription !== normalizedSessionDesc) {
      handleUpdate({ description: debouncedDescription || null });
    }
  }, [debouncedDescription, session.description, handleUpdate]);

  useEffect(() => {
    const normalizedSessionShort = session.short_description ?? '';
    if (
      debouncedShortDescription !== normalizedSessionShort &&
      validateAndUpdate('short_description', debouncedShortDescription)
    ) {
      handleUpdate({ short_description: debouncedShortDescription || null });
    }
  }, [debouncedShortDescription, session.short_description, handleUpdate, validateAndUpdate]);

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

  return (
    <div className={cn(styles.sessionCard, hasConflict && styles.hasConflict)}>
      <div className={styles.header}>
        <TextInput
          name={`session_${session.id}_title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant='unstyled'
          className={cn(styles.titleInput)}
          placeholder='Session Title'
          error={allErrors.title}
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
            error={allErrors.start_time}
          />
          <Text size='sm' c='dimmed'>
            to
          </Text>
          <TimeSelect
            value={endTime}
            onChange={(value) => handleTimeChange('end_time', value)}
            placeholder='End time'
            classNames={{ input: cn(styles.formTimeInput) }}
            error={allErrors.end_time ?? allErrors.time_order}
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

        {/* Video Section */}
        <div style={{ marginTop: 12 }}>
          <Group gap='xs' justify='space-between' align='center'>
            <Text className={cn(styles.sectionLabel)}>Video</Text>
            {streaming.streamMode !== 'NONE' && (
              <Switch
                size='xs'
                label='Enabled'
                checked={streaming.showVideo}
                onChange={(e) => streaming.handleShowVideoChange(e.currentTarget.checked)}
                color='var(--color-primary)'
                styles={SWITCH_STYLES_COMPACT}
              />
            )}
          </Group>
          <Group gap='xs' wrap='wrap' mt={4}>
            {/* Stream Mode - Primary selector */}
            <Select
              value={streaming.streamMode}
              onChange={streaming.handleStreamModeChange}
              data={[...STREAM_MODES]}
              size='sm'
              allowDeselect={false}
              style={{ width: 165 }}
              classNames={{ input: cn(styles.formSelect) }}
            />

            {/* Platform - Only for LIVE and VOD modes */}
            {streaming.streamMode !== 'NONE' && (
              <Select
                value={streaming.streamingPlatform}
                onChange={streaming.handlePlatformChange}
                data={streaming.streamMode === 'VOD' ? filteredVodPlatforms : filteredLivePlatforms}
                placeholder='Platform'
                size='sm'
                allowDeselect={false}
                style={{ width: 130 }}
                classNames={{ input: cn(styles.formSelect) }}
              />
            )}
          </Group>
          {/* Hint when some platforms are unavailable */}
          {(!availablePlatforms.hasMux || !availablePlatforms.hasJitsi) && (
            <Text size='xs' c='dimmed' mt={4}>
              More platforms available via Organization settings
            </Text>
          )}

          {/* Platform-specific fields for LIVE/VOD */}
          {streaming.streamMode !== 'NONE' && streaming.streamingPlatform && (
            <Group gap='xs' mt={8} wrap='wrap'>
              {streaming.streamingPlatform === 'VIMEO' && (
                <TextInput
                  name={`session_${session.id}_vimeo_url`}
                  placeholder={
                    streaming.streamMode === 'VOD' ?
                      'Vimeo video URL or ID'
                    : 'Vimeo stream URL or ID'
                  }
                  size='sm'
                  style={{ flex: 1, minWidth: 200 }}
                  value={streaming.streamUrl}
                  onChange={(e) => streaming.setStreamUrl(e.target.value)}
                  error={allErrors.stream_url}
                  classNames={{ input: cn(styles.formInput) }}
                />
              )}
              {streaming.streamingPlatform === 'MUX' && (
                <>
                  <TextInput
                    name={`session_${session.id}_mux_playback_id`}
                    placeholder='Mux Playback ID'
                    size='sm'
                    style={{ flex: 1, minWidth: 180 }}
                    value={streaming.streamUrl}
                    onChange={(e) => streaming.setStreamUrl(e.target.value)}
                    error={allErrors.stream_url}
                    classNames={{ input: cn(styles.formInput) }}
                  />
                  <Select
                    value={streaming.muxPlaybackPolicy}
                    onChange={streaming.handleMuxPolicyChange}
                    data={[...MUX_PLAYBACK_POLICIES]}
                    size='sm'
                    allowDeselect={false}
                    style={{ width: 100 }}
                    classNames={{ input: cn(styles.formSelect) }}
                  />
                </>
              )}
              {streaming.streamingPlatform === 'ZOOM' && (
                <>
                  <TextInput
                    name={`session_${session.id}_zoom_meeting_id`}
                    placeholder='Zoom meeting URL or ID'
                    size='sm'
                    style={{ flex: 1, minWidth: 180 }}
                    value={streaming.zoomMeetingId}
                    onChange={(e) => streaming.setZoomMeetingId(e.target.value)}
                    error={allErrors.zoom_meeting_id}
                    classNames={{ input: cn(styles.formInput) }}
                  />
                  <TextInput
                    name={`session_${session.id}_zoom_passcode`}
                    placeholder='Passcode'
                    size='sm'
                    style={{ width: 120 }}
                    value={streaming.zoomPasscode}
                    onChange={(e) => streaming.setZoomPasscode(e.target.value)}
                    classNames={{ input: cn(styles.formInput) }}
                  />
                </>
              )}
              {streaming.streamingPlatform === 'JITSI' && (
                <TextInput
                  name={`session_${session.id}_jitsi_room`}
                  placeholder='Jitsi room name or URL'
                  size='sm'
                  style={{ flex: 1, minWidth: 200 }}
                  value={streaming.jitsiRoomName}
                  onChange={(e) => streaming.setJitsiRoomName(e.target.value)}
                  error={allErrors.jitsi_room_name}
                  classNames={{ input: cn(styles.formInput) }}
                />
              )}
              {streaming.streamingPlatform === 'OTHER' && (
                <TextInput
                  name={`session_${session.id}_external_url`}
                  placeholder='External stream/video URL'
                  size='sm'
                  style={{ flex: 1, minWidth: 200 }}
                  value={streaming.streamUrl}
                  onChange={(e) => streaming.setStreamUrl(e.target.value)}
                  error={allErrors.stream_url}
                  classNames={{ input: cn(styles.formInput) }}
                />
              )}
            </Group>
          )}

          {/* Recording options - Only for LIVE mode */}
          {streaming.streamMode === 'LIVE' && streaming.streamingPlatform && (
            <div style={{ marginTop: 8 }}>
              <Switch
                size='sm'
                label='Show recording after session'
                checked={streaming.showRecording}
                onChange={(e) => streaming.handleShowRecordingChange(e.currentTarget.checked)}
                color='var(--color-primary)'
                styles={SWITCH_STYLES_REGULAR}
              />
              {streaming.showRecording && (
                <>
                  <Group gap='xs' mt={8} wrap='wrap' align='flex-end'>
                    <TextInput
                      name={`session_${session.id}_vod_url`}
                      placeholder='Recording URL (optional)'
                      size='sm'
                      style={{ flex: 1, minWidth: 200 }}
                      value={streaming.vodUrl}
                      onChange={(e) => streaming.setVodUrl(e.target.value)}
                      classNames={{ input: cn(styles.formInput) }}
                    />
                    {streaming.vodUrl && (
                      <Select
                        value={streaming.vodPlatform}
                        onChange={streaming.handleVodPlatformChange}
                        data={filteredRecordingPlatforms}
                        size='sm'
                        allowDeselect={false}
                        style={{ width: 120 }}
                        classNames={{ input: cn(styles.formSelect) }}
                      />
                    )}
                  </Group>
                  {(streaming.streamingPlatform === 'VIMEO' ||
                    streaming.streamingPlatform === 'MUX') &&
                    !streaming.vodUrl && (
                      <Text size='xs' c='dimmed' mt={4}>
                        Leave blank to use stream URL for recording
                      </Text>
                    )}
                </>
              )}
            </div>
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
            name={`session_${session.id}_short_desc`}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder='Brief summary shown in the schedule (max 200 characters)'
            maxLength={200}
            autosize
            minRows={1}
            maxRows={3}
            size='sm'
            error={allErrors.short_description}
            classNames={{ input: cn(styles.formTextarea) }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <Text className={cn(styles.sectionLabel)}>Full Description</Text>
          <Textarea
            name={`session_${session.id}_description`}
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
