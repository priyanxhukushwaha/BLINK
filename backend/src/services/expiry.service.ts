import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { deleteStoredPhoto } from './storage.service';
import { WS_EVENTS } from '../utils/constants';
import { emitToRoom } from '../websocket/realtime';

const MAX_TIMEOUT_MS = 2_147_483_647;
const SWEEP_BATCH_SIZE = 200;
const SWEEP_MAX_BATCHES = 20;

const expiryTimers = new Map<string, NodeJS.Timeout>();

export function cancelMessageExpiry(messageId: string): void {
  const timer = expiryTimers.get(messageId);
  if (timer) {
    clearTimeout(timer);
    expiryTimers.delete(messageId);
  }
}

/**
 * Schedules a best-effort exact-time deletion so clients see the expiry event
 * promptly. The periodic sweep remains the source of truth if the process
 * restarts or a timer is lost.
 */
export function scheduleMessageExpiry(messageId: string, expiresAt: Date): void {
  cancelMessageExpiry(messageId);

  const delay = expiresAt.getTime() - Date.now();
  if (delay <= 0) {
    void purgeMessageById(messageId).catch((error: unknown) => {
      logger.error('Immediate message purge failed', {
        messageId,
        error: error instanceof Error ? error.name : 'UnknownError',
      });
    });
    return;
  }

  const timer = setTimeout(() => {
    expiryTimers.delete(messageId);
    void purgeMessageById(messageId).catch((error: unknown) => {
      logger.error('Scheduled message purge failed', {
        messageId,
        error: error instanceof Error ? error.name : 'UnknownError',
      });
    });
  }, Math.min(delay, MAX_TIMEOUT_MS));

  // Do not hold the process open solely for expiry timers.
  timer.unref();
  expiryTimers.set(messageId, timer);
}

export function clearAllExpiryTimers(): void {
  for (const timer of expiryTimers.values()) {
    clearTimeout(timer);
  }
  expiryTimers.clear();
}

/**
 * Hard-deletes one message and its photo. Never soft-deletes, never archives.
 */
export async function purgeMessageById(messageId: string): Promise<boolean> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, roomId: true, photoPath: true, expiresAt: true },
  });

  if (!message) {
    cancelMessageExpiry(messageId);
    return false;
  }

  if (message.expiresAt.getTime() > Date.now()) {
    // A timer fired early (clock skew); re-arm instead of deleting.
    scheduleMessageExpiry(message.id, message.expiresAt);
    return false;
  }

  await deleteStoredPhoto(message.photoPath);
  await prisma.message.deleteMany({ where: { id: message.id } });
  cancelMessageExpiry(message.id);

  emitToRoom(message.roomId, WS_EVENTS.MESSAGE_EXPIRED, {
    roomId: message.roomId,
    messageId: message.id,
  });

  return true;
}

/** Periodic safety net; also covers messages created before a restart. */
export async function purgeExpiredMessages(): Promise<number> {
  let total = 0;

  for (let batch = 0; batch < SWEEP_MAX_BATCHES; batch += 1) {
    const expired = await prisma.message.findMany({
      where: { expiresAt: { lte: new Date() } },
      select: { id: true, roomId: true, photoPath: true },
      take: SWEEP_BATCH_SIZE,
    });

    if (expired.length === 0) {
      break;
    }

    await Promise.all(expired.map((message) => deleteStoredPhoto(message.photoPath)));
    await prisma.message.deleteMany({ where: { id: { in: expired.map((message) => message.id) } } });

    for (const message of expired) {
      cancelMessageExpiry(message.id);
      emitToRoom(message.roomId, WS_EVENTS.MESSAGE_EXPIRED, {
        roomId: message.roomId,
        messageId: message.id,
      });
    }

    total += expired.length;
    if (expired.length < SWEEP_BATCH_SIZE) {
      break;
    }
  }

  if (total > 0) {
    logger.info('Expired messages purged', { count: total });
  }

  return total;
}

export async function scheduleActiveMessages(): Promise<number> {
  const messages = await prisma.message.findMany({
    where: { expiresAt: { gt: new Date() } },
    select: { id: true, expiresAt: true },
    take: 5000,
  });

  for (const message of messages) {
    scheduleMessageExpiry(message.id, message.expiresAt);
  }

  if (messages.length === 5000) {
    logger.warn('Expiry scheduling capped at 5000 messages; the sweep covers the rest');
  }

  return messages.length;
}
