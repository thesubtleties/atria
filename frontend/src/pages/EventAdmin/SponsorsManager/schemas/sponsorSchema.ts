import { z } from 'zod';

const socialLinksSchema = z.object({
  twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  facebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
  youtube: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
  tiktok: z.string().url('Invalid TikTok URL').optional().or(z.literal('')),
  other: z.string().url('Invalid URL').optional().or(z.literal('')),
});

// Schema for individual field validation
export const sponsorFieldSchemas = {
  name: z.string().min(1, 'Sponsor name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  website_url: z
    .string()
    .url('Invalid URL format')
    .startsWith('http', 'URL must start with http:// or https://')
    .optional()
    .or(z.literal('')),

  // Contact fields
  contact_name: z.string().max(255, 'Contact name too long').optional(),
  contact_email: z.string().email('Invalid email format').optional().or(z.literal('')),
  contact_phone: z
    .string()
    .regex(/^[\d\s+()-]+$/, 'Invalid phone format')
    .max(50, 'Phone number too long')
    .optional()
    .or(z.literal('')),

  // Sponsorship details
  tier_id: z.string().min(1, 'Tier selection is required'),

  // Social links
  social_links: socialLinksSchema.optional(),
} as const;

export type SponsorFieldName = keyof typeof sponsorFieldSchemas;
export type SocialLinkPlatform = keyof z.infer<typeof socialLinksSchema>;

// Full sponsor schema for form validation
export const sponsorSchema = z.object({
  name: sponsorFieldSchemas.name,
  description: sponsorFieldSchemas.description,
  website_url: sponsorFieldSchemas.website_url,
  contact_name: sponsorFieldSchemas.contact_name,
  contact_email: sponsorFieldSchemas.contact_email,
  contact_phone: sponsorFieldSchemas.contact_phone,
  tier_id: sponsorFieldSchemas.tier_id,
  social_links: sponsorFieldSchemas.social_links,
});

// Helper to validate individual fields
export const validateField = (
  field: SponsorFieldName,
  value: unknown,
): z.SafeParseReturnType<unknown, unknown> => {
  const schema = sponsorFieldSchemas[field];
  if (!schema) return { success: true, data: value } as z.SafeParseSuccess<unknown>;

  return schema.safeParse(value);
};

// Helper to validate social link field
export const validateSocialLink = (
  platform: SocialLinkPlatform,
  url: string,
): z.SafeParseReturnType<unknown, unknown> => {
  if (!url || url === '') return { success: true, data: '' } as z.SafeParseSuccess<string>;

  const socialSchema = socialLinksSchema.shape[platform];
  if (!socialSchema) return { success: true, data: url } as z.SafeParseSuccess<string>;

  return socialSchema.safeParse(url);
};

// Tier schema for tier management
export const tierSchema = z.object({
  id: z
    .string()
    .min(1, 'Tier ID is required')
    .regex(/^[a-z0-9-]+$/, 'Tier ID must be lowercase alphanumeric with dashes'),
  name: z.string().min(1, 'Tier name is required').max(100, 'Tier name too long'),
  order: z.number().int().positive('Order must be a positive number'),
  color: z
    .string()
    .min(1, 'Color is required')
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF0000)'),
});

export const tierArraySchema = z.array(tierSchema).min(1, 'At least one tier is required');

export type SponsorFormData = z.infer<typeof sponsorSchema>;
export type TierFormData = z.infer<typeof tierSchema>;
export type SocialLinksFormData = z.infer<typeof socialLinksSchema>;
