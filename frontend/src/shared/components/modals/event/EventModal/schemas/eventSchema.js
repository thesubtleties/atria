import { z } from 'zod';

export const eventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional().nullable(),
    event_type: z.enum(['CONFERENCE', 'SINGLE_SESSION']),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    company_name: z.string().min(1, 'Company name is required'),
  })
  .refine(
    (data) => {
      // Skip validation for SINGLE_SESSION events (end date is auto-set)
      if (data.event_type === 'SINGLE_SESSION') return true;

      // Validate end date for CONFERENCE events
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['end_date'],
    }
  );
