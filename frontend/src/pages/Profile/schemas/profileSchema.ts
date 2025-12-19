import { z } from 'zod';

export const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  company_name: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  social_links: z.object({
    linkedin: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
    twitter: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
    website: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
