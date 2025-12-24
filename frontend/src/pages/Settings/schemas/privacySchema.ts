import { z } from 'zod';

// Privacy settings validation schema
export const privacySettingsSchema = z
  .object({
    email_visibility: z.enum(['event_attendees', 'connections_organizers', 'organizers_only']),

    show_public_email: z.boolean(),

    public_email: z
      .string()
      .email('Must be a valid email address')
      .or(z.literal(''))
      .optional()
      .nullable(),

    allow_connection_requests: z.enum(['event_attendees', 'speakers_organizers', 'none']),

    show_social_links: z.enum(['event_attendees', 'connections', 'hidden']),

    show_company: z.boolean(),

    show_bio: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // If showing public email, it must be provided
    if (data.show_public_email && (!data.public_email || data.public_email === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Public email is required when "Show public email" is enabled',
        path: ['public_email'],
      });
    }
  });

// Event-specific privacy override schema (for API)
export const eventPrivacyOverrideSchema = z.object({
  event_id: z.number().int().positive(),
  email_visibility: z
    .enum(['event_attendees', 'connections_organizers', 'organizers_only'])
    .optional(),
  show_public_email: z.boolean().optional(),
  public_email: z
    .string()
    .email('Must be a valid email address')
    .or(z.literal(''))
    .optional()
    .nullable(),
  allow_connection_requests: z.enum(['event_attendees', 'speakers_organizers', 'none']).optional(),
  show_social_links: z.enum(['event_attendees', 'connections', 'hidden']).optional(),
  show_company: z.boolean().optional(),
  show_bio: z.boolean().optional(),
});

// Event-specific privacy override form schema (without event_id)
export const eventPrivacyOverrideFormSchema = z
  .object({
    email_visibility: z.enum(['event_attendees', 'connections_organizers', 'organizers_only']),
    show_public_email: z.boolean(),
    public_email: z
      .string()
      .email('Must be a valid email address')
      .or(z.literal(''))
      .optional()
      .nullable(),
    allow_connection_requests: z.enum(['event_attendees', 'speakers_organizers', 'none']),
    show_social_links: z.enum(['event_attendees', 'connections', 'hidden']),
    show_company: z.boolean(),
    show_bio: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // If showing public email, it must be provided
    if (data.show_public_email && (!data.public_email || data.public_email === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Public email is required when "Show public email" is enabled',
        path: ['public_email'],
      });
    }
  });

// Schema for the update request (all fields optional)
export const privacySettingsUpdateSchema = z.object({
  email_visibility: z
    .enum(['event_attendees', 'connections_organizers', 'organizers_only'])
    .optional(),
  show_public_email: z.boolean().optional(),
  public_email: z
    .string()
    .email('Must be a valid email address')
    .or(z.literal(''))
    .optional()
    .nullable(),
  allow_connection_requests: z.enum(['event_attendees', 'speakers_organizers', 'none']).optional(),
  show_social_links: z.enum(['event_attendees', 'connections', 'hidden']).optional(),
  show_company: z.boolean().optional(),
  show_bio: z.boolean().optional(),
});

export type PrivacySettingsFormData = z.infer<typeof privacySettingsSchema>;
export type EventPrivacyOverride = z.infer<typeof eventPrivacyOverrideSchema>;
export type EventPrivacyOverrideFormData = z.infer<typeof eventPrivacyOverrideFormSchema>;
export type PrivacySettingsUpdate = z.infer<typeof privacySettingsUpdateSchema>;
