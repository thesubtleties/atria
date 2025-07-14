import { z } from 'zod';

const SessionType = z.enum([
  'KEYNOTE',
  'WORKSHOP',
  'PANEL',
  'PRESENTATION',
  'NETWORKING',
  'QA',
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
  stream_url: z.string().url('Invalid URL').optional().or(z.literal('')),
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