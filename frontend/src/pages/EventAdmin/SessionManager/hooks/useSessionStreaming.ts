import { useState, useCallback, useEffect } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  validateStreamUrl,
  validateZoomMeetingId,
  validateJitsiRoomName,
} from '../schemas/sessionCardSchema';
import type { Session, StreamingPlatform } from '@/types';

type StreamingErrors = {
  stream_url?: string;
  zoom_meeting_id?: string;
  jitsi_room_name?: string;
};

type StreamMode = 'NONE' | 'LIVE' | 'VOD';

type UseSessionStreamingProps = {
  session: Session;
  onUpdate: (updates: Partial<Session>) => Promise<void>;
};

type UseSessionStreamingReturn = {
  // State values
  streamingPlatform: StreamingPlatform | '';
  streamUrl: string;
  zoomMeetingId: string;
  zoomPasscode: string;
  muxPlaybackPolicy: string;
  jitsiRoomName: string;
  vodUrl: string;
  vodPlatform: StreamingPlatform | '';
  streamMode: StreamMode;
  showVideo: boolean;
  showRecording: boolean;
  streamingErrors: StreamingErrors;

  // Setters for controlled inputs
  setStreamUrl: (value: string) => void;
  setZoomMeetingId: (value: string) => void;
  setZoomPasscode: (value: string) => void;
  setJitsiRoomName: (value: string) => void;
  setVodUrl: (value: string) => void;

  // Handlers
  handlePlatformChange: (value: string | null) => void;
  handleStreamModeChange: (value: string | null) => void;
  handleMuxPolicyChange: (value: string | null) => void;
  handleVodPlatformChange: (value: string | null) => void;
  handleShowVideoChange: (checked: boolean) => void;
  handleShowRecordingChange: (checked: boolean) => void;
};

/**
 * Hook to manage session streaming state, validation, and auto-save logic.
 * Shared between SessionCard and SessionCardMobile to eliminate duplication.
 */
export const useSessionStreaming = ({
  session,
  onUpdate,
}: UseSessionStreamingProps): UseSessionStreamingReturn => {
  // Streaming platform state
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

  // VOD fields
  const [vodUrl, setVodUrl] = useState(session.vod_url ?? '');
  const [vodPlatform, setVodPlatform] = useState<StreamingPlatform | ''>(
    session.vod_platform ?? '',
  );

  // Stream mode and visibility
  const [streamMode, setStreamMode] = useState<StreamMode>(session.stream_mode);
  const [showVideo, setShowVideo] = useState(session.show_video);
  const [showRecording, setShowRecording] = useState(session.show_recording);

  // Streaming-related errors
  const [streamingErrors, setStreamingErrors] = useState<StreamingErrors>({});

  // Debounced values for auto-save
  const [debouncedStreamUrl] = useDebouncedValue(streamUrl, 500);
  const [debouncedZoomMeetingId] = useDebouncedValue(zoomMeetingId, 500);
  const [debouncedZoomPasscode] = useDebouncedValue(zoomPasscode, 500);
  const [debouncedJitsiRoomName] = useDebouncedValue(jitsiRoomName, 500);
  const [debouncedVodUrl] = useDebouncedValue(vodUrl, 500);

  // Helper to clear all URL-related errors
  const clearUrlErrors = useCallback(() => {
    setStreamingErrors({});
  }, []);

  // Helper to set a specific error
  const setFieldError = useCallback((field: keyof StreamingErrors, message: string) => {
    setStreamingErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  // Helper to clear a specific error
  const clearFieldError = useCallback((field: keyof StreamingErrors) => {
    setStreamingErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Platform change handler
  const handlePlatformChange = useCallback(
    (value: string | null) => {
      const platformValue = (value ?? '') as StreamingPlatform | '';
      setStreamingPlatform(platformValue);

      if (!value || value === '') {
        // Clearing platform - reset all streaming fields
        setStreamUrl('');
        setZoomMeetingId('');
        setZoomPasscode('');
        setMuxPlaybackPolicy('PUBLIC');
        setJitsiRoomName('');
        clearUrlErrors();
        onUpdate({
          streaming_platform: null,
          stream_url: null,
          zoom_meeting_id: null,
          zoom_passcode: null,
          mux_playback_policy: null,
          jitsi_room_name: null,
        });
      } else {
        // Clear old errors first, then re-validate against new platform
        clearUrlErrors();

        if (value === 'VIMEO' || value === 'MUX' || value === 'OTHER') {
          const validation = validateStreamUrl(value, streamUrl, true);
          if (!validation.success) {
            const zodError = validation.error as { errors: { message: string }[] };
            setFieldError('stream_url', zodError.errors[0]?.message ?? 'URL required');
          } else if (streamUrl) {
            // If URL is valid and non-empty, save platform + URL together
            // This ensures platform change isn't lost when URL matches session value
            onUpdate({
              streaming_platform: value as StreamingPlatform,
              stream_url: streamUrl,
            });
          }
        } else if (value === 'ZOOM') {
          const validation = validateZoomMeetingId(zoomMeetingId, true, value);
          if (!validation.success) {
            const zodError = validation.error as { errors: { message: string }[] };
            setFieldError('zoom_meeting_id', zodError.errors[0]?.message ?? 'Meeting ID required');
          } else if (zoomMeetingId) {
            // Save platform + meeting ID together
            onUpdate({
              streaming_platform: value as StreamingPlatform,
              zoom_meeting_id: zoomMeetingId,
            });
          }
        } else if (value === 'JITSI') {
          const validation = validateJitsiRoomName(jitsiRoomName, true, value);
          if (!validation.success) {
            const zodError = validation.error as { errors: { message: string }[] };
            setFieldError('jitsi_room_name', zodError.errors[0]?.message ?? 'Room name required');
          } else if (jitsiRoomName) {
            // Save platform + room name together
            onUpdate({
              streaming_platform: value as StreamingPlatform,
              jitsi_room_name: jitsiRoomName,
            });
          }
        }
      }
    },
    [streamUrl, zoomMeetingId, jitsiRoomName, onUpdate, clearUrlErrors, setFieldError],
  );

  // Stream mode change handler
  const handleStreamModeChange = useCallback(
    (value: string | null) => {
      if (value === 'NONE' || value === 'LIVE' || value === 'VOD') {
        setStreamMode(value);
        onUpdate({ stream_mode: value });

        // Clear platform when switching to NONE
        if (value === 'NONE') {
          handlePlatformChange('');
        }
      }
    },
    [onUpdate, handlePlatformChange],
  );

  // Mux policy change handler
  const handleMuxPolicyChange = useCallback(
    (value: string | null) => {
      if (value === 'PUBLIC' || value === 'SIGNED') {
        setMuxPlaybackPolicy(value);
        onUpdate({ mux_playback_policy: value });
      }
    },
    [onUpdate],
  );

  // VOD platform change handler
  const handleVodPlatformChange = useCallback(
    (value: string | null) => {
      const newValue = (value ?? '') as StreamingPlatform | '';
      setVodPlatform(newValue);
      onUpdate({ vod_platform: newValue || null });
    },
    [onUpdate],
  );

  // Show video toggle handler
  const handleShowVideoChange = useCallback(
    (checked: boolean) => {
      setShowVideo(checked);
      onUpdate({ show_video: checked });
    },
    [onUpdate],
  );

  // Show recording toggle handler
  const handleShowRecordingChange = useCallback(
    (checked: boolean) => {
      setShowRecording(checked);
      onUpdate({ show_recording: checked });
    },
    [onUpdate],
  );

  // Effect: Immediate validation for error display (no debounce)
  // This clears errors as soon as user types a valid URL, without waiting for debounce
  useEffect(() => {
    // Only validate if platform requires a URL
    const platformRequiresUrl =
      streamingPlatform === 'VIMEO' || streamingPlatform === 'MUX' || streamingPlatform === 'OTHER';

    if (!platformRequiresUrl) return;

    // If URL is non-empty, validate immediately for error display
    if (streamUrl) {
      const validation = validateStreamUrl(streamingPlatform, streamUrl);
      if (validation.success) {
        clearFieldError('stream_url');
      } else {
        const zodError = validation.error as { errors: { message: string }[] };
        setFieldError('stream_url', zodError.errors[0]?.message ?? 'Invalid URL');
      }
    }
    // Note: We don't set error when empty here - that's handled by handlePlatformChange
  }, [streamUrl, streamingPlatform, setFieldError, clearFieldError]);

  // Effect: Auto-save stream URL (for VIMEO, MUX, OTHER only) - debounced for backend
  useEffect(() => {
    // Only save stream_url for platforms that use it (not ZOOM/JITSI)
    const platformUsesStreamUrl =
      streamingPlatform === 'VIMEO' || streamingPlatform === 'MUX' || streamingPlatform === 'OTHER';

    if (!platformUsesStreamUrl) return;

    const normalizedSessionUrl = session.stream_url ?? '';
    const hasActualChange = debouncedStreamUrl !== normalizedSessionUrl;

    if (!hasActualChange) return;

    // When clearing URL: show error, don't send to backend
    if (debouncedStreamUrl === '') {
      // Don't send to backend, error is already shown by immediate validation effect
      return;
    }

    // Validate with platform-aware schema
    const validation = validateStreamUrl(streamingPlatform, debouncedStreamUrl);
    if (!validation.success) {
      // Error already shown by immediate validation effect
      return;
    }

    clearFieldError('stream_url');
    onUpdate({
      streaming_platform: (streamingPlatform || null) as StreamingPlatform | null,
      stream_url: debouncedStreamUrl,
    });
  }, [debouncedStreamUrl, session.stream_url, streamingPlatform, onUpdate, clearFieldError]);

  // Effect: Immediate validation for Zoom meeting ID (no debounce)
  useEffect(() => {
    if (streamingPlatform !== 'ZOOM') return;

    if (zoomMeetingId) {
      const validation = validateZoomMeetingId(zoomMeetingId);
      if (validation.success) {
        clearFieldError('zoom_meeting_id');
      } else {
        const zodError = validation.error as { errors: { message: string }[] };
        setFieldError('zoom_meeting_id', zodError.errors[0]?.message ?? 'Invalid meeting ID');
      }
    }
  }, [zoomMeetingId, streamingPlatform, setFieldError, clearFieldError]);

  // Effect: Auto-save Zoom meeting ID - debounced for backend (ZOOM only)
  useEffect(() => {
    // Only save zoom_meeting_id when platform is ZOOM
    if (streamingPlatform !== 'ZOOM') return;

    const normalizedSessionZoom = session.zoom_meeting_id ?? '';
    const hasActualChange = debouncedZoomMeetingId !== normalizedSessionZoom;

    if (!hasActualChange) return;

    // When clearing: don't send to backend, error shown by handlePlatformChange
    if (debouncedZoomMeetingId === '') return;

    const validation = validateZoomMeetingId(debouncedZoomMeetingId);
    if (!validation.success) {
      // Error already shown by immediate validation
      return;
    }

    clearFieldError('zoom_meeting_id');
    onUpdate({
      streaming_platform: 'ZOOM' as StreamingPlatform,
      zoom_meeting_id: debouncedZoomMeetingId,
    });
  }, [
    debouncedZoomMeetingId,
    session.zoom_meeting_id,
    streamingPlatform,
    onUpdate,
    clearFieldError,
  ]);

  // Effect: Auto-save Zoom passcode (ZOOM only)
  useEffect(() => {
    if (streamingPlatform !== 'ZOOM') return;

    const normalizedSessionPasscode = session.zoom_passcode ?? '';
    if (debouncedZoomPasscode !== normalizedSessionPasscode) {
      onUpdate({ zoom_passcode: debouncedZoomPasscode || null });
    }
  }, [debouncedZoomPasscode, session.zoom_passcode, streamingPlatform, onUpdate]);

  // Effect: Immediate validation for Jitsi room name (no debounce)
  useEffect(() => {
    if (streamingPlatform !== 'JITSI') return;

    if (jitsiRoomName) {
      const validation = validateJitsiRoomName(jitsiRoomName);
      if (validation.success) {
        clearFieldError('jitsi_room_name');
      } else {
        const zodError = validation.error as { errors: { message: string }[] };
        setFieldError('jitsi_room_name', zodError.errors[0]?.message ?? 'Invalid room name');
      }
    }
  }, [jitsiRoomName, streamingPlatform, setFieldError, clearFieldError]);

  // Effect: Auto-save Jitsi room name - debounced for backend (JITSI only)
  useEffect(() => {
    // Only save jitsi_room_name when platform is JITSI
    if (streamingPlatform !== 'JITSI') return;

    const normalizedSessionJitsi = session.jitsi_room_name ?? '';
    const hasActualChange = debouncedJitsiRoomName !== normalizedSessionJitsi;

    if (!hasActualChange) return;

    // When clearing: don't send to backend, error shown by handlePlatformChange
    if (debouncedJitsiRoomName === '') return;

    const validation = validateJitsiRoomName(debouncedJitsiRoomName);
    if (!validation.success) {
      // Error already shown by immediate validation
      return;
    }

    clearFieldError('jitsi_room_name');
    onUpdate({
      streaming_platform: 'JITSI' as StreamingPlatform,
      jitsi_room_name: debouncedJitsiRoomName,
    });
  }, [
    debouncedJitsiRoomName,
    session.jitsi_room_name,
    streamingPlatform,
    onUpdate,
    clearFieldError,
  ]);

  // Effect: Auto-save VOD URL
  useEffect(() => {
    const normalizedSessionVod = session.vod_url ?? '';
    if (debouncedVodUrl !== normalizedSessionVod) {
      onUpdate({ vod_url: debouncedVodUrl || null });
    }
  }, [debouncedVodUrl, session.vod_url, onUpdate]);

  return {
    // State values
    streamingPlatform,
    streamUrl,
    zoomMeetingId,
    zoomPasscode,
    muxPlaybackPolicy,
    jitsiRoomName,
    vodUrl,
    vodPlatform,
    streamMode,
    showVideo,
    showRecording,
    streamingErrors,

    // Setters
    setStreamUrl,
    setZoomMeetingId,
    setZoomPasscode,
    setJitsiRoomName,
    setVodUrl,

    // Handlers
    handlePlatformChange,
    handleStreamModeChange,
    handleMuxPolicyChange,
    handleVodPlatformChange,
    handleShowVideoChange,
    handleShowRecordingChange,
  };
};
