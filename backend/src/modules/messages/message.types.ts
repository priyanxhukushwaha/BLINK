import type { Prisma } from '@prisma/client';
import type { TimerOptionMinutes } from '../../utils/constants';
import { buildMessagePhotoUrl } from '../../utils/links';
import { publicUserSelect, toPublicUser } from '../users/user.types';

export const messageRelations = {
  sender: { select: publicUserSelect },
  reads: { select: { userId: true } },
} satisfies Prisma.MessageInclude;

export type MessageRow = Prisma.MessageGetPayload<{ include: typeof messageRelations }>;

export interface MessageDto {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  /** Authenticated endpoint; fetch it with the bearer token (e.g. into a blob URL). */
  photoUrl?: string;
  sentAt: number;
  firstReadAt: number | null;
  firstReadBy: string | null;
  readBy: string[];
  timerDurationMs: number;
  expiresAt: number;
  status: 'delivered' | 'read';
}

export function toMessageDto(message: MessageRow): MessageDto {
  const dto: MessageDto = {
    id: message.id,
    roomId: message.roomId,
    senderId: message.senderId,
    senderName: message.sender.displayName,
    senderAvatar: toPublicUser(message.sender).avatarUrl,
    text: message.text,
    sentAt: message.sentAt.getTime(),
    firstReadAt: message.firstReadAt ? message.firstReadAt.getTime() : null,
    firstReadBy: message.firstReadBy,
    readBy: message.reads.map((read) => read.userId),
    timerDurationMs: message.timerDurationMs,
    expiresAt: message.expiresAt.getTime(),
    status: message.firstReadAt ? 'read' : 'delivered',
  };

  if (message.photoPath) {
    dto.photoUrl = buildMessagePhotoUrl(message.roomId, message.id);
  }

  return dto;
}

export interface MessagePage {
  messages: MessageDto[];
  hasMore: boolean;
}

export interface ReadReceipt {
  roomId: string;
  messageId: string;
  readBy: string[];
  firstReadAt?: number;
  firstReadBy?: string | null;
}

export type RoomTimer = TimerOptionMinutes;
