import { z } from 'zod';

const SessionType = z.enum(['KEYNOTE', 'WORKSHOP', 'PANEL', 'PRESENTATION', 'NETWORKING', 'QA']);

const StreamingPlatform = z.enum(['VIMEO', 'MUX', 'ZOOM', 'JITSI', 'OTHER']);

const MuxPlaybackPolicy = z.enum(['PUBLIC', 'SIGNED']);

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
