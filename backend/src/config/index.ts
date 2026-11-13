import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

/**
 * Environment parsing happens once, at import time, and fails fast.
 * Secrets are never logged — only the offending variable names are reported.
 */
const booleanFromString = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  return value;
}, z.boolean());

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    API_URL: z.string().url().optional(),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    PUBLIC_APP_URL: z.string().url().default('http://localhost:5173'),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: z.string().optional(),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),

    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    UPLOAD_DIR: z.string().default('./uploads'),
    MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(2 * 1024 * 1024),

    MESSAGE_CLEANUP_INTERVAL_MS: z.coerce.number().int().min(5000).default(30_000),

    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
    RATE_LIMIT_ENABLED: booleanFromString.default(true),
  })
  .refine((env) => env.JWT_ACCESS_SECRET !== env.JWT_REFRESH_SECRET, {
    message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    path: ['JWT_REFRESH_SECRET'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration — ${details}`);
}

const env = parsed.data;

if (env.NODE_ENV === 'production' && env.CORS_ORIGIN.split(',').some((origin) => origin.trim() === '*')) {
  throw new Error('CORS_ORIGIN must not contain a wildcard in production');
}

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

export const config = Object.freeze({
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  apiUrl: stripTrailingSlash(env.API_URL ?? `http://localhost:${env.PORT}`),
  publicAppUrl: stripTrailingSlash(env.PUBLIC_APP_URL),
  corsOrigins: Object.freeze(
    env.CORS_ORIGIN.split(',')
      .map((origin) => stripTrailingSlash(origin.trim()))
      .filter(Boolean),
  ),
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL && env.REDIS_URL.trim() !== '' ? env.REDIS_URL : null,
  jwt: Object.freeze({
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
    issuer: 'blink',
    audience: 'blink-client',
  }),
  bcryptRounds: env.BCRYPT_ROUNDS,
  uploadDir,
  uploadDirs: Object.freeze({
    root: uploadDir,
    photos: path.join(uploadDir, 'photos'),
    avatars: path.join(uploadDir, 'avatars'),
    tmp: path.join(uploadDir, 'tmp'),
  }),
  maxFileSizeBytes: env.MAX_FILE_SIZE_BYTES,
  cleanupIntervalMs: env.MESSAGE_CLEANUP_INTERVAL_MS,
  logLevel: env.LOG_LEVEL,
  rateLimitEnabled: env.RATE_LIMIT_ENABLED,
});

export type AppConfig = typeof config;
