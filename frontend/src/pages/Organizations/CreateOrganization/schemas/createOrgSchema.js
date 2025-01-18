import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
});
