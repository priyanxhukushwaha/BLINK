import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { config } from '../config';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';
import { sendError } from '../utils/apiResponse';

/**
 * Central error boundary. Unknown errors never leak internals to clients and
 * never log message content — only the route and error class.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  if (error instanceof ApiError) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    sendError(
      res,
      422,
      'VALIDATION_ERROR',
      'Request validation failed',
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
    return;
  }

  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Photo exceeds the 2 MB limit');
      return;
    }
    sendError(res, 400, 'UPLOAD_ERROR', 'The upload could not be processed');
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      sendError(res, 409, 'CONFLICT', 'That record already exists');
      return;
    }
    if (error.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'Resource not found');
      return;
    }
  }

  const errorName = error instanceof Error ? error.name : 'UnknownError';
  logger.error('Unhandled request error', {
    method: req.method,
    path: req.path,
    errorName,
    ...(config.isProduction ? {} : { stack: error instanceof Error ? error.stack : undefined }),
  });

  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
};
