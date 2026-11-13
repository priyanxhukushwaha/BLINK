import type { Request, RequestHandler } from 'express';
import { prisma } from '../config/database';
import type { AuthUser } from '../types/common';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyAccessToken } from '../utils/tokens';

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

/**
 * Verifies the access token and confirms the account still exists. A deleted
 * account therefore cannot keep using a not-yet-expired access token.
 */
export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    throw ApiError.unauthorized('Missing bearer token');
  }

  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true },
  });

  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'ACCOUNT_NOT_FOUND');
  }

  req.user = user;
  next();
});

export function getUser(req: Request): AuthUser {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}
