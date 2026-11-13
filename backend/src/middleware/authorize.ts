import type { RequestHandler } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { getUser } from './authenticate';

/**
 * Defense in depth: route-level membership checks in addition to the service
 * layer checks. Both must pass.
 */
export function requireRoomMember(paramName = 'roomId'): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const user = getUser(req);
    const roomId = req.params[paramName];
    if (!roomId) {
      throw ApiError.badRequest('Room id is required');
    }

    const membership = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: user.id } },
      select: { id: true, role: true },
    });

    if (!membership) {
      throw ApiError.forbidden('You are not a member of this room', 'NOT_A_ROOM_MEMBER');
    }

    next();
  });
}

export function requireRoomAdmin(paramName = 'roomId'): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const user = getUser(req);
    const roomId = req.params[paramName];
    if (!roomId) {
      throw ApiError.badRequest('Room id is required');
    }

    const membership = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: user.id } },
      select: { id: true, role: true },
    });

    if (!membership) {
      throw ApiError.forbidden('You are not a member of this room', 'NOT_A_ROOM_MEMBER');
    }
    if (membership.role !== 'ADMIN') {
      throw ApiError.forbidden('Only the room admin can perform this action', 'ADMIN_ONLY');
    }

    next();
  });
}
