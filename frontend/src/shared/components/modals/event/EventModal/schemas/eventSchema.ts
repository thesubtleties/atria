import { z } from 'zod';

export const eventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional().nullable(),
    event_type: z.enum(['CONFERENCE', 'SINGLE_SESSION']),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    timezone: z.string().min(1, 'Timezone is required'),
    company_name: z.string().min(1, 'Company name is required'),
  })
  .refine(
    (data) => {
      // For single session, end_date must equal start_date
      if (data.event_type === 'SINGLE_SESSION') {
        return data.end_date === data.start_date;
      }
      // For conferences, end_date must be >= start_date
      return data.end_date >= data.start_date;
    },
    (data) => ({
      message:
        data.event_type === 'SINGLE_SESSION' ?
          'Single session events must start and end on the same day'
        : 'End date must be after or equal to start date',
      path: ['end_date'],
    }),
  )
  .refine(
    (data) => {
      // Ensure start_date is not in the past
      const today = new Date().toISOString().split('T')[0];
      return today !== undefined && data.start_date >= today;
    },
    {
      message: 'Start date cannot be in the past',
      path: ['start_date'],
    },
  );
export const eventUpdateSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    description: z.string().optional().nullable(),
    event_type: z.enum(['CONFERENCE', 'SINGLE_SESSION']).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    timezone: z.string().optional(),
    company_name: z.string().min(1, 'Company name is required').optional(),
  })
  .refine(
    (data) => {
      // Skip if no dates provided
      if (!data.start_date && !data.end_date) return true;

      // If only one date is provided, need both for validation
      if (data.start_date && !data.end_date) return false;
      if (!data.start_date && data.end_date) return false;

      // For single session, end_date must equal start_date
      if (data.event_type === 'SINGLE_SESSION') {
        return data.end_date === data.start_date;
      }

      // For conferences, end_date must be >= start_date
      return data.end_date! >= data.start_date!;
    },
    (data) => ({
      message:
        (data.start_date && !data.end_date) || (!data.start_date && data.end_date) ?
          'Both start and end dates must be provided together'
        : data.event_type === 'SINGLE_SESSION' ?
          'Single session events must start and end on the same day'
        : 'End date must be after or equal to start date',
      path: ['end_date'],
    }),
  )
  .refine(
    (data) => {
      // Skip if no start date provided
      if (!data.start_date) return true;

      // Ensure start_date is not in the past
      const today = new Date().toISOString().split('T')[0];
      return today !== undefined && data.start_date >= today;
    },
    {
      message: 'Start date cannot be in the past',
      path: ['start_date'],
    },
  );
