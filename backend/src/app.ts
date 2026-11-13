import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { rateLimit } from './middleware/rateLimiter';
import { authRoutes } from './modules/auth/auth.routes';
import { friendRoutes } from './modules/friends/friend.routes';
import { inviteRoutes } from './modules/invites/invite.routes';
import { messageRoutes } from './modules/messages/message.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { roomRoutes } from './modules/rooms/room.routes';
import { uploadRoutes } from './modules/uploads/upload.routes';
import { userRoutes } from './modules/users/user.routes';
import { ApiError } from './utils/ApiError';
import { sendSuccess } from './utils/apiResponse';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
      hsts: config.isProduction ? { maxAge: 15_552_000, includeSubDomains: true } : false,
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser clients do not send an Origin header.
        if (!origin) {
          callback(null, true);
          return;
        }
        const normalized = origin.replace(/\/+$/, '');
        if (config.corsOrigins.includes(normalized)) {
          callback(null, true);
          return;
        }
        callback(ApiError.forbidden('Origin not allowed by CORS', 'CORS_FORBIDDEN'));
      },
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
      maxAge: 600,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // Metadata-only request log: never paths with query strings or body content.
  app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      logger.info('http_request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
        userId: req.user?.id,
      });
    });
    next();
  });

  app.use('/api', rateLimit({ name: 'api', windowMs: 60_000, max: 100 }));

  app.get('/api/health', (_req, res) => {
    sendSuccess(res, { status: 'ok', timestamp: Date.now() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/invites', inviteRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/rooms/:roomId/messages', messageRoutes);
  app.use('/api/rooms', roomRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
