import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRoomMember } from '../../middleware/authorize';
import { rateLimit } from '../../middleware/rateLimiter';
import { uploadSinglePhoto } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import * as messageController from './message.controller';
import { listMessagesSchema, messageIdParamSchema, sendMessageSchema } from './message.validator';

const router = Router({ mergeParams: true });

router.use(authenticate, requireRoomMember('roomId'));

router.get('/', validate({ query: listMessagesSchema }), messageController.list);
router.post(
  '/',
  rateLimit({ name: 'message-send', windowMs: 60_000, max: 30, keyBy: 'user' }),
  validate({ body: sendMessageSchema }),
  messageController.send,
);
router.post(
  '/read',
  rateLimit({ name: 'message-read', windowMs: 60_000, max: 60, keyBy: 'user' }),
  messageController.markRead,
);
router.post(
  '/photo',
  rateLimit({ name: 'message-photo', windowMs: 60_000, max: 20, keyBy: 'user' }),
  uploadSinglePhoto,
  messageController.uploadPhoto,
);

router.get('/:messageId/photo', validate({ params: messageIdParamSchema }), messageController.getPhoto);
router.delete('/:messageId', validate({ params: messageIdParamSchema }), messageController.remove);

export const messageRoutes = router;
