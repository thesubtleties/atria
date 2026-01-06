import { z } from 'zod';

const SessionType = z.enum(['KEYNOTE', 'WORKSHOP', 'PANEL', 'PRESENTATION', 'NETWORKING', 'QA']);

const ChatMode = z.enum(['ENABLED', 'BACKSTAGE_ONLY', 'DISABLED']);

const StreamingPlatform = z.enum(['VIMEO', 'MUX', 'ZOOM', 'JITSI', 'OTHER']);

const MuxPlaybackPolicy = z.enum(['PUBLIC', 'SIGNED']);

const StreamMode = z.enum(['NONE', 'LIVE', 'VOD']);

// Platforms that only support playback (no interactive features like Zoom/Jitsi)
const PlaybackPlatform = z.enum(['VIMEO', 'MUX', 'OTHER']);

export const editSessionSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    short_description: z
      .string()
      .max(200, 'Short description must be 200 characters or less')
      .optional(),
    description: z.string().optional(),
    session_type: SessionType,
    day_number: z.string().min(1, 'Day number is required'),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    chat_mode: ChatMode.default('ENABLED'),

    // Streaming platform fields (multi-platform support)
    // Accept empty string (from UI) and convert to null, or accept enum values
    streaming_platform: z.preprocess(
      (val) => (val === '' ? null : val),
      StreamingPlatform.nullable().optional(),
    ),
    // For VIMEO/MUX/OTHER: Flexible to accept URLs or raw IDs
    // Platform-specific validation happens in refinements below
    stream_url: z.string().max(2000, 'Stream URL is too long').optional().or(z.literal('')),
    // For ZOOM: Meeting IDs are 9-11 digits (with optional spaces/dashes)
    zoom_meeting_id: z
      .string()
      .min(9, 'Zoom meeting ID must be at least 9 digits')
      .max(200, 'Zoom meeting URL is too long')
      .optional()
      .or(z.literal('')),
    zoom_passcode: z.string().max(50, 'Passcode is too long').optional().or(z.literal('')),
    mux_playback_policy: MuxPlaybackPolicy.optional(), // Optional for MUX
    // For JITSI: Room names should be 3-200 characters
    jitsi_room_name: z
      .string()
      .min(3, 'Room name must be at least 3 characters')
      .max(200, 'Room name is too long')
      .optional()
      .or(z.literal('')),
    // Note: OTHER platform uses stream_url with additional HTTPS validation (see refinements below)

    // Stream mode and visibility toggles
    stream_mode: StreamMode.default('NONE'),
    show_video: z.boolean().default(true),
    show_recording: z.boolean().default(true),

    // Visibility window override (null = use event default, 0 = always visible)
    visibility_minutes_override: z.preprocess(
      (val) =>
        val === '' ? null
        : val === null ? null
        : Number(val),
      z.number().int().min(0).max(60).nullable().optional(),
    ),

    // VOD fields (for recording URL after live session)
    vod_url: z.string().max(2000, 'URL too long').optional().or(z.literal('')),
    vod_platform: z.preprocess(
      (val) => (val === '' ? null : val),
      PlaybackPlatform.nullable().optional(),
    ),
  })
  .refine(
    (data) => {
      // Compare times
      const startParts = data.start_time.split(':').map(Number);
      const endParts = data.end_time.split(':').map(Number);
      const startHour = startParts[0] ?? 0;
      const startMin = startParts[1] ?? 0;
      const endHour = endParts[0] ?? 0;
      const endMin = endParts[1] ?? 0;

      return endHour > startHour || (endHour === startHour && endMin > startMin);
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    },
  )
  .refine(
    (data) => {
      // If VIMEO platform selected, stream_url is required
      if (data.streaming_platform === 'VIMEO') {
        return data.stream_url && data.stream_url.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Vimeo URL or video ID is required when platform is Vimeo',
      path: ['stream_url'],
    },
  )
  .refine(
    (data) => {
      // If MUX platform selected, stream_url is required
      if (data.streaming_platform === 'MUX') {
        return data.stream_url && data.stream_url.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Mux Playback ID or stream URL is required when platform is Mux',
      path: ['stream_url'],
    },
  )
  .refine(
    (data) => {
      // If ZOOM platform selected, zoom_meeting_id is required
      if (data.streaming_platform === 'ZOOM') {
        return data.zoom_meeting_id && data.zoom_meeting_id.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Zoom meeting URL or ID is required when platform is Zoom',
      path: ['zoom_meeting_id'],
    },
  )
  .refine(
    (data) => {
      // If JITSI platform selected, jitsi_room_name is required
      if (data.streaming_platform === 'JITSI') {
        return data.jitsi_room_name && data.jitsi_room_name.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Jitsi room name is required when platform is Jitsi',
      path: ['jitsi_room_name'],
    },
  )
  .refine(
    (data) => {
      // If OTHER platform selected, stream_url is required
      if (data.streaming_platform === 'OTHER') {
        return data.stream_url && data.stream_url.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Stream URL is required when platform is Other',
      path: ['stream_url'],
    },
  )
  .refine(
    (data) => {
      // If OTHER platform, stream_url must be a valid HTTPS URL
      if (
        data.streaming_platform === 'OTHER' &&
        data.stream_url &&
        data.stream_url.trim().length > 0
      ) {
        try {
          const url = new URL(data.stream_url);
          return url.protocol === 'https:';
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Stream URL must be a valid HTTPS URL for external platforms',
      path: ['stream_url'],
    },
  )
  // Stream mode conditional validation
  .refine(
    (data) => {
      // If stream_mode is LIVE or VOD, platform is required
      if (data.stream_mode === 'LIVE' || data.stream_mode === 'VOD') {
        return !!data.streaming_platform;
      }
      return true;
    },
    {
      message: 'Please select a streaming platform',
      path: ['streaming_platform'],
    },
  )
  .refine(
    (data) => {
      // If stream_mode is VOD, platform cannot be ZOOM or JITSI (interactive-only platforms)
      if (data.stream_mode === 'VOD') {
        return data.streaming_platform !== 'ZOOM' && data.streaming_platform !== 'JITSI';
      }
      return true;
    },
    {
      message: 'VOD mode only supports Vimeo, Mux, or Other platforms (not Zoom or Jitsi)',
      path: ['streaming_platform'],
    },
  )
  .refine(
    (data) => {
      // If vod_url is provided and not empty, it should be a valid URL
      if (data.vod_url && data.vod_url.trim().length > 0) {
        try {
          new URL(data.vod_url);
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Recording URL must be a valid URL',
      path: ['vod_url'],
    },
  );
