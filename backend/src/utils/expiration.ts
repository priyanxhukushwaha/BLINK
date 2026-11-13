import { MAX_MESSAGE_LIFETIME_MS } from './constants';

/**
 * Authoritative expiration math — mirrors the frontend implementation.
 *
 * Unread messages expire at sentAt + 60 minutes.
 * Read messages expire at min(sentAt + 60 minutes, firstReadAt + timer).
 * The timer never pauses and can never extend beyond the absolute ceiling.
 */
export function timerMinutesToMs(minutes: number): number {
  return minutes * 60_000;
}

export function computeExpiresAt(sentAt: Date, firstReadAt: Date | null, timerDurationMs: number): Date {
  const absoluteCeiling = sentAt.getTime() + MAX_MESSAGE_LIFETIME_MS;
  if (!firstReadAt) {
    return new Date(absoluteCeiling);
  }
  return new Date(Math.min(absoluteCeiling, firstReadAt.getTime() + timerDurationMs));
}

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime();
}

export function remainingMs(expiresAt: Date, now: Date = new Date()): number {
  return Math.max(0, expiresAt.getTime() - now.getTime());
}
