import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { rateLimit } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import * as inviteController from './invite.controller';
import { inviteCodeParamSchema } from './invite.validator';

const router = Router();

router.use(authenticate);

router.get('/link', inviteController.getLink);
router.post(
  '/accept/:inviteCode',
  rateLimit({ name: 'invite-accept', windowMs: 60_000, max: 20, keyBy: 'user' }),
  validate({ params: inviteCodeParamSchema }),
  inviteController.accept,
);

export const inviteRoutes = router;
