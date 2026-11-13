import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { rateLimit } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import * as authController from './auth.controller';
import { loginSchema, refreshTokenSchema, registerSchema } from './auth.validator';

const router = Router();

const authLimiter = rateLimit({ name: 'auth', windowMs: 60_000, max: 5 });

router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post(
  '/refresh',
  rateLimit({ name: 'auth-refresh', windowMs: 60_000, max: 30 }),
  validate({ body: refreshTokenSchema }),
  authController.refresh,
);

// Logout is possession-based (refresh token) so it still works with an expired
// access token; it revokes exactly the presented refresh token.
router.post('/logout', validate({ body: refreshTokenSchema }), authController.logout);

router.get('/me', authenticate, authController.me);

export const authRoutes = router;
