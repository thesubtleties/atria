import { z } from 'zod';

// Privacy settings validation schema
export const privacySettingsSchema = z.object({
  email_visibility: z.enum([
    'everyone',
    'connections_organizers',
    'organizers_only',
    'hidden'
  ]),
  
  show_public_email: z.boolean(),
  
  public_email: z
    .string()
    .email('Must be a valid email address')
    .or(z.literal(''))
    .optional()
    .nullable(),
  
  allow_connection_requests: z.enum([
    'everyone',
    'event_attendees',
    'speakers_organizers',
    'none'
  ]),
  
  show_social_links: z.enum([
    'everyone',
    'connections',
    'hidden'
  ]),
  
  show_company: z.boolean(),
  
  show_bio: z.boolean(),
}).superRefine((data, ctx) => {
  // If showing public email, it must be provided
  if (data.show_public_email && (!data.public_email || data.public_email === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Public email is required when "Show public email" is enabled',
      path: ['public_email'],
    });
  }
});

// Event-specific privacy override schema
export const eventPrivacyOverrideSchema = z.object({
  event_id: z.number().int().positive(),
  email_visibility: z.enum([
    'everyone',
    'connections_organizers',
    'organizers_only',
    'hidden'
  ]).optional(),
  show_public_email: z.boolean().optional(),
  public_email: z.string().email('Must be a valid email address').or(z.literal('')).optional().nullable(),
  allow_connection_requests: z.enum([
    'everyone',
    'event_attendees',
    'speakers_organizers',
    'none'
  ]).optional(),
  show_social_links: z.enum([
    'everyone',
    'connections',
    'hidden'
  ]).optional(),
  show_company: z.boolean().optional(),
  show_bio: z.boolean().optional(),
});

// Schema for the update request (all fields optional)
export const privacySettingsUpdateSchema = z.object({
  email_visibility: z.enum([
    'everyone',
    'connections_organizers',
    'organizers_only',
    'hidden'
  ]).optional(),
  show_public_email: z.boolean().optional(),
  public_email: z.string().email('Must be a valid email address').or(z.literal('')).optional().nullable(),
  allow_connection_requests: z.enum([
    'everyone',
    'event_attendees',
    'speakers_organizers',
    'none'
  ]).optional(),
  show_social_links: z.enum([
    'everyone',
    'connections',
    'hidden'
  ]).optional(),
  show_company: z.boolean().optional(),
  show_bio: z.boolean().optional(),
});