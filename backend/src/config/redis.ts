import Redis from 'ioredis';
import { config } from './index';
import { logger } from './logger';

let client: Redis | null = null;
let available = false;
let reportedError = false;

/**
 * Redis is optional in development: rate limiting falls back to an in-process
 * limiter. In production REDIS_URL should be set for cross-instance limits.
 */
export function getRedis(): Redis | null {
  return available ? client : null;
}

export function isRedisAvailable(): boolean {
  return available;
}

export async function connectRedis(): Promise<void> {
  if (!config.redisUrl) {
    logger.info('Redis not configured — using in-memory rate limiting');
    return;
  }

  const redis = new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 3000,
  });

  redis.on('error', (error: Error) => {
    available = false;
    if (!reportedError) {
      reportedError = true;
      logger.warn('Redis error — falling back to in-memory rate limiting', { message: error.message });
    }
  });

  try {
    await redis.connect();
    await redis.ping();
    client = redis;
    available = true;
    logger.info('Redis connected');
  } catch (error) {
    available = false;
    redis.disconnect();
    logger.warn('Redis unavailable — using in-memory rate limiting', {
      message: error instanceof Error ? error.message : 'connection failed',
    });
  }
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    client.disconnect();
    client = null;
    available = false;
  }
}
