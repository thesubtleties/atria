import { z } from 'zod';

export const eventUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  event_type: z.enum(['CONFERENCE', 'SINGLE_SESSION']),
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  end_date: z.date({
    required_error: 'End date is required',
  }),
  timezone: z.string().min(1, 'Timezone is required'),
  company_name: z.string().min(1, 'Company name is required'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  main_session_id: z.string().nullable().optional(),
}).refine((data) => data.end_date >= data.start_date, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

export const eventFormatSchema = z.object({
  event_format: z.enum(['VIRTUAL', 'IN_PERSON', 'HYBRID']),
  is_private: z.boolean(),
  venue_name: z.string().optional(),
  venue_address: z.string().optional(),
  venue_city: z.string().optional(),
  venue_state: z.string().optional(),
  venue_country: z.string().optional(),
}).refine((data) => {
  // If event is in-person or hybrid, venue details are required
  if (data.event_format === 'IN_PERSON' || data.event_format === 'HYBRID') {
    return data.venue_name && data.venue_city && data.venue_country;
  }
  return true;
}, {
  message: 'Venue details are required for in-person and hybrid events',
  path: ['venue_name'],
});

export const eventBrandingSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  logo_url: z.string().url().nullable().optional(),
});

export const heroSectionSchema = z.object({
  hero_description: z.string().optional(),
  desktop_image: z.string().url().nullable().optional(),
  mobile_image: z.string().url().nullable().optional(),
});

export const highlightSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

export const faqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export const contentSectionsSchema = z.object({
  welcome_title: z.string().optional(),
  welcome_content: z.string().optional(),
  highlights: z.array(highlightSchema).optional(),
  faqs: z.array(faqSchema).optional(),
});

export const icebreakersSchema = z.object({
  message: z.string().min(10, 'Icebreaker message must be at least 10 characters'),
});