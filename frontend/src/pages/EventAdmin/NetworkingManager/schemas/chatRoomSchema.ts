import { z } from 'zod';

export const chatRoomSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  roomType: z.enum(['GLOBAL', 'ADMIN', 'GREEN_ROOM'], {
    required_error: 'Room type is required',
  }),
  isEnabled: z.boolean().default(false),
});

export type ChatRoomFormData = z.infer<typeof chatRoomSchema>;
