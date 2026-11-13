import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { MEDIA_UPLOAD_TTL_MS } from '../../utils/constants';
import { buildUploadPreviewUrl } from '../../utils/links';
import { processImage, resolveStoredFile } from '../../services/storage.service';
import { assertRoomMembership } from '../rooms/room.service';
import type { UploadedFile } from './upload.types';

export interface PhotoUploadResult {
  photoUrl: string;
  expiresAt: number;
}

/**
 * Validates the image (re-encoding strips EXIF), stores it outside any public
 * directory and records a short-lived upload that must be consumed by a message
 * in the same room before it expires.
 */
export async function createRoomPhotoUpload(
  roomId: string,
  userId: string,
  file: UploadedFile,
): Promise<PhotoUploadResult> {
  await assertRoomMembership(roomId, userId);

  const stored = await processImage(file.path, 'photos');
  const expiresAt = new Date(Date.now() + MEDIA_UPLOAD_TTL_MS);

  const upload = await prisma.mediaUpload.create({
    data: {
      userId,
      roomId,
      filePath: stored.filePath,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      expiresAt,
    },
  });

  return {
    photoUrl: buildUploadPreviewUrl(upload.id),
    expiresAt: expiresAt.getTime(),
  };
}

export interface PendingUploadFile {
  absolutePath: string;
  mimeType: string;
}

export async function getPendingUpload(uploadId: string, userId: string): Promise<PendingUploadFile> {
  const upload = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
  if (!upload || upload.userId !== userId || upload.expiresAt.getTime() <= Date.now()) {
    throw ApiError.notFound('Photo upload not found or expired', 'UPLOAD_NOT_FOUND');
  }

  return {
    absolutePath: resolveStoredFile('photos', upload.filePath),
    mimeType: upload.mimeType,
  };
}
