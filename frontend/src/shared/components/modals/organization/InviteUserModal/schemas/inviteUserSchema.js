import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['MEMBER', 'ADMIN']),
});
