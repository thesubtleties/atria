import { z } from 'zod';

const SessionType = z.enum([
  'KEYNOTE',
  'WORKSHOP',
  'PANEL',
  'PRESENTATION',
  'NETWORKING',
  'QA',
]);

const StreamingPlatform = z.enum([
  'VIMEO',
  'MUX',
  'ZOOM',
  'JITSI',
  'OTHER',
]);

const MuxPlaybackPolicy = z.enum([
  'PUBLIC',
  'SIGNED',
]);

// Schema for individual field validation
export const sessionFieldSchemas = {
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  short_description: z.string().max(200, 'Short description must be 200 characters or less'),
  description: z.string().optional(),
  session_type: SessionType,
  start_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  // Streaming platform fields (flexible validation for inline editing)
  streaming_platform: StreamingPlatform.nullable().optional(),
  stream_url: z.string()
    .min(8, 'Vimeo ID must be 8+ digits, or Mux ID 10+ characters')
    .max(500, 'URL too long')
    .optional()
    .or(z.literal('')),
  zoom_meeting_id: z.string()
    .min(9, 'Zoom ID must be at least 9 digits')
    .max(200, 'URL too long')
    .optional()
    .or(z.literal('')),
  zoom_passcode: z.string()
    .max(50, 'Passcode too long')
    .optional()
    .or(z.literal('')),
  mux_playback_policy: MuxPlaybackPolicy.optional(),
  jitsi_room_name: z.string()
    .min(3, 'Room name must be at least 3 characters')
    .max(200, 'Room name too long')
    .optional()
    .or(z.literal('')),
  other_stream_url: z.string()
    .url('Must be a valid URL')
    .startsWith('https://', 'URL must use HTTPS')
    .max(500, 'URL too long')
    .optional()
    .or(z.literal('')),
};

// Helper to validate individual fields
export const validateField = (field, value) => {
  const schema = sessionFieldSchemas[field];
  if (!schema) return { success: true };
  
  const result = schema.safeParse(value);
  return result;
};

// Helper to validate time logic
export const validateTimeOrder = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const isValid = endHour > startHour || (endHour === startHour && endMin > startMin);
  
  return {
    success: isValid,
    error: isValid ? null : { message: 'End time must be after start time' }
  };
};