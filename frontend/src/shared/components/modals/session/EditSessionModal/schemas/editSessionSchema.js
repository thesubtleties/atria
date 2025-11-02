import { z } from 'zod';

const SessionType = z.enum([
  'KEYNOTE',
  'WORKSHOP',
  'PANEL',
  'PRESENTATION',
  'NETWORKING',
  'QA',
]);

const ChatMode = z.enum([
  'ENABLED',
  'BACKSTAGE_ONLY',
  'DISABLED',
]);

const StreamingPlatform = z.enum([
  'VIMEO',
  'MUX',
  'ZOOM',
]);

const MuxPlaybackPolicy = z.enum([
  'PUBLIC',
  'SIGNED',
]);

export const editSessionSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    short_description: z.string().max(200, 'Short description must be 200 characters or less').optional(),
    description: z.string().optional(),
    session_type: SessionType,
    day_number: z.string().min(1, 'Day number is required'),
    start_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    end_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    chat_mode: ChatMode.default('ENABLED'),

    // Streaming platform fields (multi-platform support)
    // Accept empty string (from UI) and convert to null, or accept enum values
    streaming_platform: z.preprocess(
      (val) => val === '' ? null : val,
      StreamingPlatform.nullable().optional()
    ),
    // For VIMEO/MUX: Flexible to accept URLs or raw IDs
    // Vimeo IDs are typically 8-9 digits, Mux IDs are 10+ alphanumeric
    stream_url: z.string()
      .min(8, 'Vimeo video ID must be at least 8 digits, or Mux playback ID at least 10 characters')
      .max(500, 'Stream URL is too long')
      .optional()
      .or(z.literal('')),
    // For ZOOM: Meeting IDs are 9-11 digits (with optional spaces/dashes)
    zoom_meeting_id: z.string()
      .min(9, 'Zoom meeting ID must be at least 9 digits')
      .max(200, 'Zoom meeting URL is too long')
      .optional()
      .or(z.literal('')),
    zoom_passcode: z.string()
      .max(50, 'Passcode is too long')
      .optional()
      .or(z.literal('')),
    mux_playback_policy: MuxPlaybackPolicy.optional(), // Optional for MUX
  })
  .refine(
    (data) => {
      // Compare times
      const [startHour, startMin] = data.start_time.split(':').map(Number);
      const [endHour, endMin] = data.end_time.split(':').map(Number);

      return (
        endHour > startHour || (endHour === startHour && endMin > startMin)
      );
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
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
    }
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
    }
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
    }
  );
