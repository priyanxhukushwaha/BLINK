import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { rateLimit } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import * as friendController from './friend.controller';
import { friendIdParamSchema, friendRequestSchema, requestIdParamSchema } from './friend.validator';

const router = Router();

router.use(authenticate);

router.get('/', friendController.list);
router.get('/requests', friendController.listRequests);
router.post(
  '/request',
  rateLimit({ name: 'friend-request', windowMs: 60_000, max: 20, keyBy: 'user' }),
  validate({ body: friendRequestSchema }),
  friendController.sendRequest,
);
router.post('/accept/:requestId', validate({ params: requestIdParamSchema }), friendController.accept);
router.post('/reject/:requestId', validate({ params: requestIdParamSchema }), friendController.reject);
router.delete('/:friendId', validate({ params: friendIdParamSchema }), friendController.remove);

export const friendRoutes = router;
