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
import { validateField, validateTimeOrder } from '../schemas/sessionCardSchema';
import { formatTime } from '@/shared/utils/formatting';
import styles from '../styles/index.module.css';

const SESSION_TYPES = [
  { value: 'KEYNOTE', label: 'Keynote' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'PANEL', label: 'Panel' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'QA', label: 'Q&A' },
];

const CHAT_MODES = [
  { value: 'ENABLED', label: 'All Chat Enabled' },
  { value: 'BACKSTAGE_ONLY', label: 'Backstage Only' },
  { value: 'DISABLED', label: 'Chat Disabled' },
];

const STREAMING_PLATFORMS = [
  { value: '', label: 'No Streaming' },
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'MUX', label: 'Mux' },
  { value: 'ZOOM', label: 'Zoom' },
];

const MUX_PLAYBACK_POLICIES = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'SIGNED', label: 'Signed' },
];

export const SessionCardMobile = ({ session, hasConflict }) => {
  const [updateSession] = useUpdateSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Local state for immediate UI updates
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description || '');
  const [shortDescription, setShortDescription] = useState(session.short_description || '');
  const [sessionType, setSessionType] = useState(session.session_type);
  const [startTime, setStartTime] = useState(session.start_time);
  const [endTime, setEndTime] = useState(session.end_time);
  const [chatMode, setChatMode] = useState(session.chat_mode || 'ENABLED');

  // Streaming platform state
  const [streamingPlatform, setStreamingPlatform] = useState(session.streaming_platform || '');
  const [streamUrl, setStreamUrl] = useState(session.stream_url || '');
  const [zoomMeetingId, setZoomMeetingId] = useState(session.zoom_meeting_id || '');
  const [zoomPasscode, setZoomPasscode] = useState(session.zoom_passcode || '');
  const [muxPlaybackPolicy, setMuxPlaybackPolicy] = useState(
    session.mux_playback_policy || 'PUBLIC',
  );

  // Validation error states
  const [errors, setErrors] = useState({});

  // Track if we have a pending platform change that needs to be saved with URL
  const pendingPlatformChangeRef = useRef(false);

  // Debounce values for auto-save
  const [debouncedTitle] = useDebouncedValue(title, 500);
  const [debouncedDescription] = useDebouncedValue(description, 500);
  const [debouncedShortDescription] = useDebouncedValue(shortDescription, 500);
  const [debouncedStreamUrl] = useDebouncedValue(streamUrl, 500);
  const [debouncedZoomMeetingId] = useDebouncedValue(zoomMeetingId, 500);
  const [debouncedZoomPasscode] = useDebouncedValue(zoomPasscode, 500);

  // Auto-save when debounced values change
  const handleUpdate = useCallback(
    async (updates) => {
      try {
        await updateSession({
          id: session.id,
          ...updates,
        }).unwrap();
      } catch (error) {
        console.error('Failed to update session:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to update session',
          color: 'red',
        });
      }
    },
    [session.id, updateSession],
  );

  // Validate field before updating
  const validateAndUpdate = useCallback((field, value) => {
    const validation = validateField(field, value);

    if (!validation.success) {
      setErrors((prev) => ({
        ...prev,
        [field]: validation.error.errors[0].message,
      }));
      return false;
    }

    // Clear error if validation passes
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });

    return true;
  }, []);

  // Update on debounced changes
  useEffect(() => {
    if (debouncedTitle !== session.title && validateAndUpdate('title', debouncedTitle)) {
      handleUpdate({ title: debouncedTitle });
    }
  }, [debouncedTitle, session.title, handleUpdate, validateAndUpdate]);

  useEffect(() => {
    if (debouncedDescription !== session.description) {
      handleUpdate({ description: debouncedDescription });
    }
  }, [debouncedDescription, session.description, handleUpdate]);

  useEffect(() => {
    if (
      debouncedShortDescription !== session.short_description &&
      validateAndUpdate('short_description', debouncedShortDescription)
    ) {
      handleUpdate({ short_description: debouncedShortDescription });
    }
  }, [debouncedShortDescription, session.short_description, handleUpdate, validateAndUpdate]);

  useEffect(() => {
    if (
      debouncedStreamUrl !== session.stream_url &&
      (debouncedStreamUrl === '' || validateAndUpdate('stream_url', debouncedStreamUrl))
    ) {
      // If we have a pending platform change, save platform + URL together
      if (pendingPlatformChangeRef.current) {
        handleUpdate({
          streaming_platform: streamingPlatform || null,
          stream_url: debouncedStreamUrl,
        });
        pendingPlatformChangeRef.current = false;
      } else {
        handleUpdate({ stream_url: debouncedStreamUrl });
      }
    }
  }, [debouncedStreamUrl, session.stream_url, streamingPlatform, handleUpdate, validateAndUpdate]);

  useEffect(() => {
    if (
      debouncedZoomMeetingId !== session.zoom_meeting_id &&
      (debouncedZoomMeetingId === '' ||
        validateAndUpdate('zoom_meeting_id', debouncedZoomMeetingId))
    ) {
      // If we have a pending platform change, save platform + meeting ID together
      if (pendingPlatformChangeRef.current) {
        handleUpdate({
          streaming_platform: streamingPlatform || null,
          zoom_meeting_id: debouncedZoomMeetingId,
        });
        pendingPlatformChangeRef.current = false;
      } else {
        handleUpdate({ zoom_meeting_id: debouncedZoomMeetingId });
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
      handleUpdate({ zoom_passcode: debouncedZoomPasscode });
    }
  }, [debouncedZoomPasscode, session.zoom_passcode, handleUpdate]);

  // Calculate duration
  const calculateDuration = (start, end) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const totalMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleTimeChange = (field, value) => {
    if (!value) return;

    // Validate time format
    if (!validateAndUpdate(field, value)) {
      return;
    }

    // Always update local state immediately for better UX
    if (field === 'start_time') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }

    // Check time order validation with the new values
    const newStartTime = field === 'start_time' ? value : startTime;
    const newEndTime = field === 'end_time' ? value : endTime;
    const timeOrderValidation = validateTimeOrder(newStartTime, newEndTime);

    if (!timeOrderValidation.success) {
      // Show error but don't prevent local state update
      setErrors((prev) => ({
        ...prev,
        time_order: timeOrderValidation.error.message,
      }));
      // Don't update backend if validation fails
      return;
    }

    // Clear time order error if validation passes
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.time_order;
      return newErrors;
    });

    // Always send both times when clearing a time order error to ensure backend is in sync
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
      onConfirm: async () => {
        try {
          await deleteSession(session.id).unwrap();
          notifications.show({
            title: 'Success',
            message: 'Session deleted successfully',
            color: 'green',
          });
        } catch (error) {
          console.error('Failed to delete session:', error);
          notifications.show({
            title: 'Error',
            message: 'Failed to delete session',
            color: 'red',
          });
        }
      },
    });
  };

  const getSessionTypeLabel = (type) => {
    return SESSION_TYPES.find((t) => t.value === type)?.label || type;
  };

  // Get the appropriate badge class based on session type
  const getSessionTypeBadgeClass = (type) => {
    const typeClassMap = {
      KEYNOTE: styles.badgeKeynote,
      WORKSHOP: styles.badgeWorkshop,
      PANEL: styles.badgePanel,
      PRESENTATION: styles.badgePresentation,
      NETWORKING: styles.badgeNetworking,
      QA: styles.badgeQa,
    };
    return typeClassMap[type] || styles.sessionTypeBadge;
  };

  return (
    <div className={`${styles.sessionCard} ${hasConflict ? styles.hasConflict : ''}`}>
      {/* Actions Menu - Top right corner */}
      <Menu position='bottom-end' withinPortal>
        <Menu.Target>
          <ActionIcon
            variant='subtle'
            color='gray'
            className={styles.mobileActionButton}
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

      {/* Collapsed View - Always Visible */}
      <Stack gap='xs'>
        {/* Title Input */}
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant='unstyled'
          className={styles.titleInput}
          placeholder='Session Title'
          error={errors.title}
          style={{ paddingRight: '2.5rem' }}
        />

        {/* Time and Basic Info */}
        <Group justify='space-between' wrap='nowrap'>
          <div className={styles.mobileTimeDisplay}>
            <IconClock size={16} />
            <Text size='sm'>
              {formatTime(startTime)} - {formatTime(endTime)}
            </Text>
            <Badge size='sm' className={styles.durationPill}>
              {calculateDuration(startTime, endTime)}
            </Badge>
          </div>
        </Group>

        {/* Session Type and Conflict Badge */}
        <Group gap='xs'>
          <Badge className={getSessionTypeBadgeClass(sessionType)} size='sm'>
            {getSessionTypeLabel(sessionType)}
          </Badge>
          {hasConflict && (
            <Badge
              className={styles.conflictPill}
              size='sm'
              leftSection={<IconAlertCircle size={12} />}
            >
              Overlaps
            </Badge>
          )}
        </Group>

        {/* Expandable Section Trigger */}
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

      {/* Expanded Content */}
      <Collapse in={detailsExpanded}>
        <div className={styles.collapsedContent}>
          <Stack gap='md' mt='md'>
            {/* Time Selection */}
            <Group grow>
              <TimeSelect
                value={startTime}
                onChange={(value) => handleTimeChange('start_time', value)}
                placeholder='Start time'
                label='Start Time'
                error={errors.start_time}
                size='sm'
                classNames={{ input: styles.formTimeInput }}
              />
              <TimeSelect
                value={endTime}
                onChange={(value) => handleTimeChange('end_time', value)}
                placeholder='End time'
                label='End Time'
                error={errors.end_time || errors.time_order}
                size='sm'
                classNames={{ input: styles.formTimeInput }}
              />
            </Group>

            {/* Session Type */}
            <Select
              label='Session Type'
              value={sessionType}
              onChange={(value) => {
                setSessionType(value);
                handleUpdate({ session_type: value });
              }}
              data={SESSION_TYPES}
              size='sm'
              allowDeselect={false}
              classNames={{ input: styles.formSelect }}
            />

            {/* Chat Mode */}
            <Select
              label='Chat Mode'
              value={chatMode}
              onChange={(value) => {
                setChatMode(value);
                handleUpdate({ chat_mode: value });
              }}
              data={CHAT_MODES}
              size='sm'
              allowDeselect={false}
              classNames={{ input: styles.formSelect }}
            />

            {/* Streaming Platform */}
            <Select
              label='Streaming Platform'
              placeholder='Select platform'
              value={streamingPlatform}
              onChange={(value) => {
                setStreamingPlatform(value);

                // If clearing platform (No Streaming), save immediately and clear all fields
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
                  // Switching TO a platform - don't save yet, wait for URL
                  pendingPlatformChangeRef.current = true;
                }
              }}
              data={STREAMING_PLATFORMS}
              size='sm'
              allowDeselect={false}
              classNames={{ input: styles.formSelect }}
            />

            {/* Conditional streaming fields */}
            {streamingPlatform === 'VIMEO' && (
              <TextInput
                label='Vimeo URL or Video ID'
                placeholder='https://vimeo.com/123... or ID'
                size='sm'
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                error={errors.stream_url}
                classNames={{ input: styles.formInput }}
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
                  classNames={{ input: styles.formInput }}
                />
                <Select
                  label='Mux Playback Policy'
                  value={muxPlaybackPolicy}
                  onChange={(value) => {
                    setMuxPlaybackPolicy(value);
                    handleUpdate({ mux_playback_policy: value });
                  }}
                  data={MUX_PLAYBACK_POLICIES}
                  size='sm'
                  allowDeselect={false}
                  classNames={{ input: styles.formSelect }}
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
                  classNames={{ input: styles.formInput }}
                />
                <TextInput
                  label='Passcode (Optional)'
                  placeholder='Meeting passcode'
                  size='sm'
                  value={zoomPasscode}
                  onChange={(e) => setZoomPasscode(e.target.value)}
                  classNames={{ input: styles.formInput }}
                />
              </>
            )}

            {/* Speakers */}
            <div className={styles.speakersSection}>
              <Text size='sm' fw={500} mb='xs'>
                Speakers
              </Text>
              <SessionSpeakers
                sessionId={session.id}
                eventId={session.event_id}
                canEdit={true}
                preloadedSpeakers={session.session_speakers}
              />
            </div>

            {/* Short Description */}
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
              classNames={{ input: styles.formTextarea }}
            />

            {/* Full Description */}
            <Textarea
              label='Full Description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Detailed session description'
              autosize
              minRows={3}
              maxRows={6}
              size='sm'
              classNames={{ input: styles.formTextarea }}
            />
          </Stack>
        </div>
      </Collapse>
    </div>
  );
};
