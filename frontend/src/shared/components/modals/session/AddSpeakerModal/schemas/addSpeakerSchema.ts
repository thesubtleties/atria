import { z } from 'zod';

export const addSpeakerSchema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  speaker_bio: z.string().optional(),
});
