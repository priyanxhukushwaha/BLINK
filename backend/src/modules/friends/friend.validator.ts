import { z } from 'zod';

export const friendRequestSchema = z
  .object({
    userId: z.string().uuid('A valid user id is required'),
  })
  .strict();

export const requestIdParamSchema = z.object({
  requestId: z.string().uuid('A valid request id is required'),
});

export const friendIdParamSchema = z.object({
  friendId: z.string().uuid('A valid friend id is required'),
});
