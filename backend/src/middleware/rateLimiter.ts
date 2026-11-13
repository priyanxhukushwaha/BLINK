import type { RequestHandler } from 'express';
import { config } from '../config';
import { getRedis } from '../config/redis';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

interface RateLimitOptions {
  /** Prefix so different limiters never share buckets. */
  name: string;
  windowMs: number;
  max: number;
  keyBy?: 'ip' | 'user';
}

interface MemoryCounter {
  count: number;
  resetAt: number;
}

const memoryCounters = new Map<string, MemoryCounter>();

function incrementMemory(key: string, resetAt: number, now: number): number {
  // Opportunistic cleanup keeps the fallback bounded without a timer.
  if (memoryCounters.size > 5000) {
    for (const [storedKey, counter] of memoryCounters) {
      if (counter.resetAt <= now) memoryCounters.delete(storedKey);
    }
  }

  const existing = memoryCounters.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryCounters.set(key, { count: 1, resetAt });
    return 1;
  }
  existing.count += 1;
  return existing.count;
}

export function rateLimit(options: RateLimitOptions): RequestHandler {
  return asyncHandler(async (req, res, next) => {
    if (!config.rateLimitEnabled) {
      next();
      return;
    }

    const now = Date.now();
    const windowStart = Math.floor(now / options.windowMs);
    const resetAt = (windowStart + 1) * options.windowMs;
    const identifier = options.keyBy === 'user' ? (req.user?.id ?? req.ip ?? 'unknown') : (req.ip ?? 'unknown');
    const bucketKey = `ratelimit:${options.name}:${identifier}:${windowStart}`;

    let count: number;
    const redis = getRedis();
    if (redis) {
      try {
        count = await redis.incr(bucketKey);
        if (count === 1) {
          await redis.pexpire(bucketKey, options.windowMs);
        }
      } catch {
        count = incrementMemory(bucketKey, resetAt, now);
      }
    } else {
      count = incrementMemory(bucketKey, resetAt, now);
    }

    const remaining = Math.max(0, options.max - count);
    const resetSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
    res.setHeader('RateLimit-Limit', String(options.max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(resetSeconds));

    if (count > options.max) {
      res.setHeader('Retry-After', String(resetSeconds));
      throw ApiError.tooManyRequests('Too many requests. Please slow down.', 'RATE_LIMITED');
    }

    next();
  });
}

/** Exposed for tests that need a clean limiter state. */
export function resetMemoryRateLimits(): void {
  memoryCounters.clear();
}
