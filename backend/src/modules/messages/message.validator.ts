import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_MESSAGE_LENGTH, MAX_PAGE_SIZE } from '../../utils/constants';

export const listMessagesSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    before: z.string().uuid('The cursor must be a message id').optional(),
  })
  .strict();

export const sendMessageSchema = z
  .object({
    text: z.string().max(MAX_MESSAGE_LENGTH * 2).optional(),
    photoUrl: z.string().min(1).max(300).optional(),
  })
  .strict()
  .refine((value) => (value.text ?? '').trim().length > 0 || Boolean(value.photoUrl), {
    message: 'A message needs text or a photo',
  });

export const messageIdParamSchema = z.object({
  roomId: z.string().uuid(),
  messageId: z.string().uuid('A valid message id is required'),
});

export type ListMessagesQuery = z.infer<typeof listMessagesSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
