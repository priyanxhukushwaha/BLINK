import { z } from 'zod';
import {
  MAX_GROUP_MEMBERS,
  MAX_GROUP_NAME_LENGTH,
  TIMER_OPTIONS,
} from '../../utils/constants';
import { isSafeHttpsUrl } from '../../utils/links';

export const timerMinutesSchema = z
  .number()
  .int()
  .refine((value) => (TIMER_OPTIONS as readonly number[]).includes(value), {
    message: 'Timer must be one of 1, 5, 15, 30 or 60 minutes',
  });

export const roomIdParamSchema = z.object({
  roomId: z.string().uuid('A valid room id is required'),
});

export const roomMemberParamSchema = z.object({
  roomId: z.string().uuid('A valid room id is required'),
  userId: z.string().uuid('A valid user id is required'),
});

export const createPrivateRoomSchema = z
  .object({
    recipientId: z.string().uuid('A valid recipient id is required'),
  })
  .strict();

export const createGroupRoomSchema = z
  .object({
    name: z.string().trim().min(1, 'Group name is required').max(MAX_GROUP_NAME_LENGTH * 2),
    avatarUrl: z
      .string()
      .url('Avatar must be a URL')
      .max(500)
      .refine(isSafeHttpsUrl, 'Avatar must use https')
      .optional(),
    memberIds: z
      .array(z.string().uuid('Member ids must be valid user ids'))
      .min(1, 'Add at least one other member')
      .max(MAX_GROUP_MEMBERS - 1),
    timerMinutes: timerMinutesSchema.optional(),
  })
  .strict();

export const updateRoomTimerSchema = z
  .object({
    timerMinutes: timerMinutesSchema,
  })
  .strict();

export const addRoomMembersSchema = z
  .object({
    memberIds: z
      .array(z.string().uuid('Member ids must be valid user ids'))
      .min(1, 'Add at least one member')
      .max(MAX_GROUP_MEMBERS),
  })
  .strict();

export type CreateGroupRoomInput = z.infer<typeof createGroupRoomSchema>;
