import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { rateLimit } from '../../middleware/rateLimiter';
import { uploadSinglePhoto } from '../../middleware/upload';
import * as userController from './user.controller';
import { searchUsersSchema, updateProfileSchema, userIdParamSchema } from './user.validator';

const router = Router();

// Public avatar endpoint (safe: unguessable user ids, no private data).
router.get('/:userId/avatar', validate({ params: userIdParamSchema }), userController.getAvatar);

// Everything below requires a valid access token.
router.use(authenticate);

router.get('/search', validate({ query: searchUsersSchema }), userController.search);
router.get('/me', userController.getMe);
router.patch('/me', validate({ body: updateProfileSchema }), userController.updateMe);
router.post(
  '/me/avatar',
  rateLimit({ name: 'avatar-upload', windowMs: 60_000, max: 10, keyBy: 'user' }),
  uploadSinglePhoto,
  userController.uploadAvatar,
);

router.get('/:userId', validate({ params: userIdParamSchema }), userController.getUserById);

export const userRoutes = router;
