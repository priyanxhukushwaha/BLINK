import { config } from '../config';
import { logger } from '../config/logger';
import { purgeExpiredMessages } from '../services/expiry.service';

let interval: NodeJS.Timeout | null = null;
let running = false;

async function sweep(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await purgeExpiredMessages();
  } catch (error) {
    logger.error('Expiration sweep failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
  } finally {
    running = false;
  }
}

export function startExpirationJob(): void {
  if (interval) return;

  interval = setInterval(() => {
    void sweep();
  }, config.cleanupIntervalMs);

  void sweep();
  logger.info('Expiration job started', { intervalMs: config.cleanupIntervalMs });
}

export function stopExpirationJob(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

/** Used by tests to run a deterministic sweep. */
export async function runExpirationSweepNow(): Promise<void> {
  await sweep();
}
