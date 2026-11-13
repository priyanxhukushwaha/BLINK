import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import * as notificationController from './notification.controller';
import { listNotificationsSchema, notificationIdParamSchema } from './notification.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listNotificationsSchema }), notificationController.list);
router.patch('/:id/read', validate({ params: notificationIdParamSchema }), notificationController.markRead);

export const notificationRoutes = router;
