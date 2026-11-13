import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../utils/constants';

export const listNotificationsSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    before: z.string().uuid().optional(),
  })
  .strict();

export const notificationIdParamSchema = z.object({
  id: z.string().uuid('A valid notification id is required'),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
