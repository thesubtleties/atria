import { z } from 'zod';

const SessionType = z.enum([
  'KEYNOTE',
  'WORKSHOP',
  'PANEL',
  'PRESENTATION',
  'NETWORKING',
  'QA',
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
    stream_url: z.string().url().optional().or(z.literal('')),
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
  );
