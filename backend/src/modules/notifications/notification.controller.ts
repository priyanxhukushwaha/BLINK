import type { RequestHandler } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getUser } from '../../middleware/authenticate';
import * as notificationService from './notification.service';
import type { ListNotificationsQuery } from './notification.validator';

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const result = await notificationService.listNotifications(
    user.id,
    req.query as unknown as ListNotificationsQuery,
  );
  sendSuccess(res, result);
});

export const markRead: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const result = await notificationService.markNotificationRead(user.id, req.params.id ?? '');
  sendSuccess(res, result);
});
