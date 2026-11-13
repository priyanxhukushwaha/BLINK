import { z } from 'zod';

export const inviteCodeParamSchema = z.object({
  inviteCode: z.string().trim().min(4).max(64),
});
