import { logger } from '../config/logger';
import { clearAllExpiryTimers, scheduleActiveMessages } from '../services/expiry.service';
import { ensureUploadDirs } from '../services/storage.service';
import { startCleanupJob, stopCleanupJob } from './cleanup.job';
import { startExpirationJob, stopExpirationJob } from './expiration.job';

export async function startJobs(): Promise<void> {
  await ensureUploadDirs();

  const scheduled = await scheduleActiveMessages();
  startExpirationJob();
  startCleanupJob();

  logger.info('Background jobs started', { scheduledMessages: scheduled });
}

export function stopJobs(): void {
  stopExpirationJob();
  stopCleanupJob();
  clearAllExpiryTimers();
}
