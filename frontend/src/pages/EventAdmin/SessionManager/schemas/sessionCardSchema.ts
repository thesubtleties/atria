import { z } from 'zod';

const SessionType = z.enum(['KEYNOTE', 'WORKSHOP', 'PANEL', 'PRESENTATION', 'NETWORKING', 'QA']);

const StreamingPlatform = z.enum(['VIMEO', 'MUX', 'ZOOM', 'JITSI', 'OTHER']);

const MuxPlaybackPolicy = z.enum(['PUBLIC', 'SIGNED']);

const StreamMode = z.enum(['NONE', 'LIVE', 'VOD']);

// Platform-specific URL/ID validation patterns
const vimeoSchema = z
  .string()
  .regex(
    /^(\d+|https?:\/\/(player\.)?vimeo\.com\/(video\/)?\d+.*)$/,
    'Enter Vimeo video ID (numbers only) or full URL (https://vimeo.com/123456789)',
  );

const muxSchema = z
  .string()
  .regex(
    /^([a-zA-Z0-9]{10,}|https?:\/\/stream\.mux\.com\/.+)$/,
    'Enter Mux Playback ID (10+ alphanumeric chars) or stream URL',
  );

const otherUrlSchema = z.string().regex(/^https:\/\/.+/, 'Must be a valid HTTPS URL');

const zoomSchema = z
  .string()
  .regex(
    /^(https?:\/\/([\w-]+\.)?zoom\.us\/j\/\d+.*|\d[\d\s-]{8,14}\d)$/,
    'Enter Zoom meeting URL or ID (9-11 digits, spaces/dashes OK)',
  );

const jitsiSchema = z
  .string()
  .regex(
    /^(https?:\/\/.+|[a-zA-Z0-9][a-zA-Z0-9\s_-]{1,198}[a-zA-Z0-9])$/,
    'Enter Jitsi room name (3+ chars) or full URL',
  );

// Schema for individual field validation
export const sessionFieldSchemas = {
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  short_description: z.string().max(200, 'Short description must be 200 characters or less'),
  description: z.string().optional(),
  session_type: SessionType,
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  // Streaming platform fields (flexible validation for inline editing)
  streaming_platform: StreamingPlatform.nullable().optional(),
  stream_url: z
    .string()
    .min(3, 'Stream URL or ID required')
    .max(2000, 'URL too long')
    .optional()
    .or(z.literal('')),
  zoom_meeting_id: z
    .string()
    .min(9, 'Zoom ID must be at least 9 digits')
    .max(200, 'URL too long')
    .optional()
    .or(z.literal('')),
  zoom_passcode: z.string().max(50, 'Passcode too long').optional().or(z.literal('')),
  mux_playback_policy: MuxPlaybackPolicy.optional(),
  jitsi_room_name: z
    .string()
    .min(3, 'Room name must be at least 3 characters')
    .max(200, 'Room name too long')
    .optional()
    .or(z.literal('')),
  // Note: OTHER platform uses stream_url (validated by backend for HTTPS)

  // Stream mode and visibility toggles
  stream_mode: StreamMode,
  show_video: z.boolean(),
  show_recording: z.boolean(),

  // Visibility window override (null = use event default, 0 = always visible)
  visibility_minutes_override: z.number().int().min(0).max(60).nullable().optional(),

  // VOD fields (for recording URL after live session)
  vod_url: z.string().max(2000, 'URL too long').optional().or(z.literal('')),
  vod_platform: z.enum(['VIMEO', 'MUX', 'OTHER']).nullable().optional(), // Only playback platforms, not interactive
} as const;

export type SessionFieldName = keyof typeof sessionFieldSchemas;

// Helper to validate individual fields
export const validateField = (
  field: SessionFieldName,
  value: unknown,
): z.SafeParseReturnType<unknown, unknown> => {
  const schema = sessionFieldSchemas[field];
  if (!schema) return { success: true, data: value } as z.SafeParseSuccess<unknown>;

  return schema.safeParse(value);
};

type TimeValidationResult = {
  success: boolean;
  error: { message: string } | null;
};

// Helper to validate time logic
export const validateTimeOrder = (startTime: string, endTime: string): TimeValidationResult => {
  const startParts = startTime.split(':').map(Number);
  const endParts = endTime.split(':').map(Number);
  const startHour = startParts[0] ?? 0;
  const startMin = startParts[1] ?? 0;
  const endHour = endParts[0] ?? 0;
  const endMin = endParts[1] ?? 0;

  const isValid = endHour > startHour || (endHour === startHour && endMin > startMin);

  return {
    success: isValid,
    error: isValid ? null : { message: 'End time must be after start time' },
  };
};

export type SessionTypeValue = z.infer<typeof SessionType>;
export type StreamingPlatformValue = z.infer<typeof StreamingPlatform>;
export type MuxPlaybackPolicyValue = z.infer<typeof MuxPlaybackPolicy>;

// Platform-aware validation for stream URL (used by Vimeo, Mux, Other)
// Set requireIfPlatformSet=true to require URL when platform is selected
export const validateStreamUrl = (
  platform: string | null | undefined,
  value: string,
  requireIfPlatformSet = false,
): z.SafeParseReturnType<string, string> => {
  // Check if URL is required but missing
  if (!value) {
    if (
      requireIfPlatformSet &&
      (platform === 'VIMEO' || platform === 'MUX' || platform === 'OTHER')
    ) {
      // Build user-friendly error message
      const errorMessage =
        platform === 'MUX' ? 'Mux Playback ID required'
        : platform === 'VIMEO' ? 'Vimeo video URL or ID required'
        : 'URL required';
      return {
        success: false,
        error: { errors: [{ message: errorMessage }] },
      } as z.SafeParseReturnType<string, string>;
    }
    return { success: true, data: '' } as z.SafeParseSuccess<string>;
  }

  switch (platform) {
    case 'VIMEO':
      return vimeoSchema.safeParse(value);
    case 'MUX':
      return muxSchema.safeParse(value);
    case 'OTHER':
      return otherUrlSchema.safeParse(value);
    default:
      return { success: true, data: value } as z.SafeParseSuccess<string>;
  }
};

// Platform-aware validation for Zoom meeting ID
// Set requireIfPlatformSet=true to require meeting ID when platform is ZOOM
export const validateZoomMeetingId = (
  value: string,
  requireIfPlatformSet = false,
  platform?: string | null,
): z.SafeParseReturnType<string, string> => {
  if (!value) {
    if (requireIfPlatformSet && platform === 'ZOOM') {
      return {
        success: false,
        error: { errors: [{ message: 'Zoom meeting URL or ID required' }] },
      } as z.SafeParseReturnType<string, string>;
    }
    return { success: true, data: '' } as z.SafeParseSuccess<string>;
  }
  return zoomSchema.safeParse(value);
};

// Platform-aware validation for Jitsi room name
// Set requireIfPlatformSet=true to require room name when platform is JITSI
export const validateJitsiRoomName = (
  value: string,
  requireIfPlatformSet = false,
  platform?: string | null,
): z.SafeParseReturnType<string, string> => {
  if (!value) {
    if (requireIfPlatformSet && platform === 'JITSI') {
      return {
        success: false,
        error: { errors: [{ message: 'Jitsi room name required' }] },
      } as z.SafeParseReturnType<string, string>;
    }
    return { success: true, data: '' } as z.SafeParseSuccess<string>;
  }
  return jitsiSchema.safeParse(value);
};
