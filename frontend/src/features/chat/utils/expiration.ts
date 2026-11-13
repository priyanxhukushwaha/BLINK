import { Message } from '../types/chat';

export const MAX_MESSAGE_LIFETIME_MS = 60 * 60 * 1000; // 60 minutes absolute hard cap

/**
 * Returns the authoritative expiration timestamp for a message.
 * The backend computes it when the message is sent/read (first read starts the
 * timer), so clients simply honour that deadline.
 */
export function calculateExpirationTime(message: Message): number {
  if (typeof message.expiresAt === 'number' && Number.isFinite(message.expiresAt)) {
    return message.expiresAt;
  }

  const absoluteCeiling = message.sentAt + MAX_MESSAGE_LIFETIME_MS;
  if (!message.firstReadAt) {
    return absoluteCeiling;
  }
  const timerExpiration = message.firstReadAt + message.timerDurationMs;
  return Math.min(absoluteCeiling, timerExpiration);
}

/**
 * Returns remaining milliseconds based on wall-clock time.
 * Closing/reopening the app never pauses the timer.
 */
export function getRemainingTimeMs(message: Message, now: number = Date.now()): number {
  const expiresAt = calculateExpirationTime(message);
  return Math.max(0, expiresAt - now);
}

/**
 * Formats remaining time into clean UI text (e.g. "30m", "5m", "45s", "0s").
 */
export function formatRemainingTime(remainingMs: number): string {
  if (remainingMs <= 0) return '0s';
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Checks if a message has reached its expiration time.
 */
export function isMessageExpired(message: Message, now: number = Date.now()): boolean {
  return getRemainingTimeMs(message, now) <= 0;
}
