import { z } from 'zod';
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
} from '../../utils/constants';

export const usernameSchema = z
  .string()
  .trim()
  .min(MIN_USERNAME_LENGTH, `Username must be at least ${MIN_USERNAME_LENGTH} characters`)
  .max(MAX_USERNAME_LENGTH, `Username must be at most ${MAX_USERNAME_LENGTH} characters`)
  .regex(/^@?[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
  .transform((value) => value.replace(/^@/, '').toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes',
  });

export const registerSchema = z
  .object({
    username: usernameSchema,
    displayName: z.string().trim().min(1, 'Display name is required').max(MAX_DISPLAY_NAME_LENGTH * 2),
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1)
      .max(MAX_USERNAME_LENGTH + 1)
      .transform((value) => value.replace(/^@/, '').toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(20).max(4096),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
