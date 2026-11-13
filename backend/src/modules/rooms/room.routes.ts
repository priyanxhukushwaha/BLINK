import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRoomAdmin, requireRoomMember } from '../../middleware/authorize';
import { rateLimit } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import * as roomController from './room.controller';
import {
  addRoomMembersSchema,
  createGroupRoomSchema,
  createPrivateRoomSchema,
  roomIdParamSchema,
  roomMemberParamSchema,
  updateRoomTimerSchema,
} from './room.validator';

const router = Router();

// Public generated avatar (see controller note).
router.get('/:roomId/avatar', validate({ params: roomIdParamSchema }), roomController.getAvatar);

router.use(authenticate);

router.get('/', roomController.list);
router.post(
  '/private',
  rateLimit({ name: 'room-create-private', windowMs: 60_000, max: 20, keyBy: 'user' }),
  validate({ body: createPrivateRoomSchema }),
  roomController.createPrivate,
);
router.post(
  '/group',
  rateLimit({ name: 'room-create-group', windowMs: 60_000, max: 10, keyBy: 'user' }),
  validate({ body: createGroupRoomSchema }),
  roomController.createGroup,
);

router.get('/:roomId', validate({ params: roomIdParamSchema }), requireRoomMember(), roomController.getById);
router.patch(
  '/:roomId/timer',
  validate({ params: roomIdParamSchema }),
  requireRoomMember(),
  validate({ body: updateRoomTimerSchema }),
  roomController.updateTimer,
);
router.get(
  '/:roomId/members',
  validate({ params: roomIdParamSchema }),
  requireRoomMember(),
  roomController.listMembers,
);
router.post(
  '/:roomId/members',
  validate({ params: roomIdParamSchema }),
  requireRoomAdmin(),
  validate({ body: addRoomMembersSchema }),
  roomController.addMembers,
);
router.delete(
  '/:roomId/members/:userId',
  validate({ params: roomMemberParamSchema }),
  requireRoomAdmin(),
  roomController.removeMember,
);
router.delete(
  '/:roomId/leave',
  validate({ params: roomIdParamSchema }),
  roomController.leave,
);

export const roomRoutes = router;
