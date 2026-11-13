import type { Notification, NotificationType } from '@prisma/client';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: unknown;
  isRead: boolean;
  createdAt: number;
}

export function toNotificationDto(notification: Notification): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    isRead: notification.isRead,
    createdAt: notification.createdAt.getTime(),
  };
}
