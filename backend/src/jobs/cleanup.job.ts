import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { deleteStoredPhoto, safeUnlink } from '../services/storage.service';

const HOUR_MS = 60 * 60 * 1000;

let interval: NodeJS.Timeout | null = null;
let running = false;

async function purgeAbandonedUploads(): Promise<number> {
  const uploads = await prisma.mediaUpload.findMany({
    where: { expiresAt: { lte: new Date() } },
    select: { id: true, filePath: true },
  });

  if (uploads.length === 0) {
    return 0;
  }

  await Promise.all(uploads.map((upload) => deleteStoredPhoto(upload.filePath)));
  await prisma.mediaUpload.deleteMany({ where: { id: { in: uploads.map((upload) => upload.id) } } });
  return uploads.length;
}

async function purgeTempFiles(): Promise<number> {
  const entries = await fs.readdir(config.uploadDirs.tmp).catch(() => [] as string[]);
  let removed = 0;

  for (const entry of entries) {
    const absolutePath = path.join(config.uploadDirs.tmp, path.basename(entry));
    const stat = await fs.stat(absolutePath).catch(() => null);
    if (stat && Date.now() - stat.mtimeMs > HOUR_MS) {
      await safeUnlink(absolutePath);
      removed += 1;
    }
  }

  return removed;
}

async function purgeEmptyRooms(): Promise<number> {
  const emptyRooms = await prisma.room.findMany({
    where: { type: 'GROUP', members: { none: {} } },
    select: { id: true, messages: { select: { photoPath: true } } },
  });

  for (const room of emptyRooms) {
    await Promise.all(room.messages.map((message) => deleteStoredPhoto(message.photoPath)));
    await prisma.room.delete({ where: { id: room.id } }).catch(() => undefined);
  }

  return emptyRooms.length;
}

async function cleanup(): Promise<void> {
  if (running) return;
  running = true;

  try {
    const [uploads, tempFiles, emptyRooms, expiredTokens] = await Promise.all([
      purgeAbandonedUploads(),
      purgeTempFiles(),
      purgeEmptyRooms(),
      prisma.refreshToken.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
    ]);

    if (uploads || tempFiles || emptyRooms || expiredTokens.count) {
      logger.info('Cleanup job finished', {
        abandonedUploads: uploads,
        tempFiles,
        emptyRooms,
        expiredRefreshTokens: expiredTokens.count,
      });
    }
  } catch (error) {
    logger.error('Cleanup job failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
  } finally {
    running = false;
  }
}

export function startCleanupJob(): void {
  if (interval) return;

  interval = setInterval(() => {
    void cleanup();
  }, HOUR_MS);

  void cleanup();
  logger.info('Cleanup job started', { intervalMs: HOUR_MS });
}

export function stopCleanupJob(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}
