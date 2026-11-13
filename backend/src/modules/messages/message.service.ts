import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { cleanMultiline } from '../../utils/sanitize';
import { MAX_MESSAGE_LENGTH, WS_EVENTS } from '../../utils/constants';
import { computeExpiresAt, timerMinutesToMs } from '../../utils/expiration';
import { parseUploadUrl } from '../../utils/links';
import { deleteStoredPhoto, resolveStoredFile } from '../../services/storage.service';
import { emitToRoom } from '../../websocket/realtime';
import {
  cancelMessageExpiry,
  purgeMessageById,
  scheduleMessageExpiry,
} from '../../services/expiry.service';
import { assertRoomMembership } from '../rooms/room.service';
import {
  messageRelations,
  toMessageDto,
  type MessageDto,
  type MessagePage,
  type ReadReceipt,
} from './message.types';
import type { ListMessagesQuery, SendMessageInput } from './message.validator';

export async function listMessages(
  roomId: string,
  userId: string,
  query: ListMessagesQuery,
): Promise<MessagePage> {
  await assertRoomMembership(roomId, userId);

  const messages = await prisma.message.findMany({
    where: { roomId, expiresAt: { gt: new Date() } },
    include: messageRelations,
    orderBy: { sentAt: 'desc' },
    take: query.limit + 1,
    ...(query.before ? { cursor: { id: query.before }, skip: 1 } : {}),
  });

  const hasMore = messages.length > query.limit;
  const page = hasMore ? messages.slice(0, query.limit) : messages;

  return {
    messages: page.reverse().map(toMessageDto),
    hasMore,
  };
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  input: SendMessageInput,
): Promise<MessageDto> {
  const membership = await assertRoomMembership(roomId, senderId);

  const text = cleanMultiline(input.text ?? '', MAX_MESSAGE_LENGTH);
  let photoPath: string | null = null;
  let photoMimeType: string | null = null;
  let uploadId: string | null = null;

  if (input.photoUrl) {
    uploadId = parseUploadUrl(input.photoUrl);
    if (!uploadId) {
      throw ApiError.badRequest('Invalid photo attachment URL', 'INVALID_PHOTO');
    }

    const upload = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
    if (
      !upload ||
      upload.userId !== senderId ||
      upload.roomId !== roomId ||
      upload.expiresAt.getTime() <= Date.now()
    ) {
      throw ApiError.badRequest('Photo attachment is invalid or has expired', 'INVALID_PHOTO');
    }

    photoPath = upload.filePath;
    photoMimeType = upload.mimeType;
  }

  if (!text && !photoPath) {
    throw ApiError.badRequest('A message needs text or a photo', 'EMPTY_MESSAGE');
  }

  const sentAt = new Date();
  const timerDurationMs = timerMinutesToMs(membership.room.timerMinutes);
  const expiresAt = computeExpiresAt(sentAt, null, timerDurationMs);

  const message = await prisma.$transaction(async (tx) => {
    if (uploadId) {
      const consumed = await tx.mediaUpload.deleteMany({ where: { id: uploadId, userId: senderId } });
      if (consumed.count !== 1) {
        throw ApiError.badRequest('Photo attachment is no longer available', 'INVALID_PHOTO');
      }
    }

    const created = await tx.message.create({
      data: {
        roomId,
        senderId,
        text,
        photoPath,
        photoMimeType,
        sentAt,
        timerDurationMs,
        expiresAt,
      },
      include: messageRelations,
    });

    // Keep the room list ordered by latest activity.
    await tx.room.update({ where: { id: roomId }, data: { updatedAt: sentAt } });

    return created;
  });

  const dto = toMessageDto(message);
  scheduleMessageExpiry(message.id, message.expiresAt);
  emitToRoom(roomId, WS_EVENTS.NEW_MESSAGE, dto);
  return dto;
}

export async function markRoomRead(
  roomId: string,
  userId: string,
): Promise<{ readCount: number }> {
  await assertRoomMembership(roomId, userId);

  const now = new Date();
  const unread = await prisma.message.findMany({
    where: { roomId, senderId: { not: userId }, firstReadAt: null, expiresAt: { gt: now } },
    select: { id: true, sentAt: true, timerDurationMs: true },
  });

  const alreadyStarted = await prisma.message.findMany({
    where: {
      roomId,
      senderId: { not: userId },
      firstReadAt: { not: null },
      expiresAt: { gt: now },
      reads: { none: { userId } },
    },
    select: { id: true },
  });

  const touchedIds = new Set<string>();

  await prisma.$transaction(async (tx) => {
    for (const message of unread) {
      // firstReadAt is locked forever once set: the update only matches when
      // it is still null, so concurrent readers cannot overwrite it.
      await tx.message.updateMany({
        where: { id: message.id, firstReadAt: null },
        data: {
          firstReadAt: now,
          firstReadBy: userId,
          expiresAt: computeExpiresAt(message.sentAt, now, message.timerDurationMs),
        },
      });

      await tx.messageRead.createMany({
        data: [{ messageId: message.id, userId, readAt: now }],
        skipDuplicates: true,
      });
      touchedIds.add(message.id);
    }

    if (alreadyStarted.length > 0) {
      await tx.messageRead.createMany({
        data: alreadyStarted.map((message) => ({ messageId: message.id, userId, readAt: now })),
        skipDuplicates: true,
      });
      for (const message of alreadyStarted) {
        touchedIds.add(message.id);
      }
    }
  });

  if (touchedIds.size === 0) {
    return { readCount: 0 };
  }

  const ids = [...touchedIds];
  const [reads, messages] = await Promise.all([
    prisma.messageRead.findMany({
      where: { messageId: { in: ids } },
      select: { messageId: true, userId: true },
    }),
    prisma.message.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        roomId: true,
        firstReadAt: true,
        firstReadBy: true,
        expiresAt: true,
      },
    }),
  ]);

  const readersByMessage = new Map<string, string[]>();
  for (const read of reads) {
    const current = readersByMessage.get(read.messageId) ?? [];
    current.push(read.userId);
    readersByMessage.set(read.messageId, current);
  }

  for (const message of messages) {
    const receipt: ReadReceipt = {
      roomId: message.roomId,
      messageId: message.id,
      readBy: readersByMessage.get(message.id) ?? [],
      firstReadAt: message.firstReadAt ? message.firstReadAt.getTime() : undefined,
      firstReadBy: message.firstReadBy,
    };
    emitToRoom(message.roomId, WS_EVENTS.MESSAGE_READ, receipt);
    scheduleMessageExpiry(message.id, message.expiresAt);
  }

  return { readCount: touchedIds.size };
}

export async function deleteMessage(
  roomId: string,
  messageId: string,
  userId: string,
): Promise<{ deleted: true }> {
  await assertRoomMembership(roomId, userId);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, roomId: true, senderId: true, photoPath: true },
  });

  if (!message || message.roomId !== roomId) {
    throw ApiError.notFound('Message not found', 'MESSAGE_NOT_FOUND');
  }
  if (message.senderId !== userId) {
    throw ApiError.forbidden('You can only delete your own messages', 'NOT_MESSAGE_OWNER');
  }

  await deleteStoredPhoto(message.photoPath);
  await prisma.message.deleteMany({ where: { id: message.id } });
  cancelMessageExpiry(message.id);
  emitToRoom(roomId, WS_EVENTS.MESSAGE_DELETED, { roomId, messageId: message.id });

  return { deleted: true };
}

export interface MessagePhotoFile {
  absolutePath: string;
  mimeType: string;
}

export async function getMessagePhoto(
  roomId: string,
  messageId: string,
  userId: string,
): Promise<MessagePhotoFile> {
  await assertRoomMembership(roomId, userId);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, roomId: true, photoPath: true, photoMimeType: true, expiresAt: true },
  });

  if (!message || message.roomId !== roomId || !message.photoPath) {
    throw ApiError.notFound('Photo not found', 'PHOTO_NOT_FOUND');
  }
  if (message.expiresAt.getTime() <= Date.now()) {
    void purgeMessageById(message.id).catch(() => undefined);
    throw ApiError.notFound('Photo has expired', 'PHOTO_EXPIRED');
  }

  return {
    absolutePath: resolveStoredFile('photos', message.photoPath),
    mimeType: message.photoMimeType ?? 'application/octet-stream',
  };
}
