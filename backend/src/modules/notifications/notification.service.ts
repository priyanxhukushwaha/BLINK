import type { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { WS_EVENTS } from '../../utils/constants';
import { emitToUser } from '../../websocket/realtime';
import { toNotificationDto, type NotificationDto } from './notification.types';
import type { ListNotificationsQuery } from './notification.validator';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}

/**
 * Notifications carry ids and generic copy only — never message text.
 */
export async function createNotification(input: CreateNotificationInput): Promise<NotificationDto> {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      ...(input.data === undefined ? {} : { data: input.data }),
    },
  });

  const dto = toNotificationDto(notification);
  emitToUser(input.userId, WS_EVENTS.NOTIFICATION, { type: notification.type, data: dto });
  return dto;
}

export async function listNotifications(
  userId: string,
  query: ListNotificationsQuery,
): Promise<{ notifications: NotificationDto[]; hasMore: boolean }> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    ...(query.before ? { cursor: { id: query.before }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    take: query.limit + 1,
  });

  const hasMore = notifications.length > query.limit;
  const page = hasMore ? notifications.slice(0, query.limit) : notifications;
  return { notifications: page.map(toNotificationDto), hasMore };
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<{ id: string; isRead: true }> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });

  if (result.count === 0) {
    throw ApiError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  }

  return { id: notificationId, isRead: true };
}
