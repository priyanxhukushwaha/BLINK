import type { RequestHandler } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { asyncHandler } from '../../utils/asyncHandler';
import { getUser } from '../../middleware/authenticate';
import { createInitialsAvatar } from '../../services/storage.service';
import * as roomService from './room.service';
import type { CreateGroupRoomInput } from './room.validator';
import type { TimerOptionMinutes } from '../../utils/constants';

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  sendSuccess(res, await roomService.listRooms(user.id));
});

export const createPrivate: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const { recipientId } = req.body as { recipientId: string };
  sendSuccess(res, await roomService.createPrivateRoom(user.id, recipientId), 201);
});

export const createGroup: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const room = await roomService.createGroupRoom(user.id, req.body as CreateGroupRoomInput);
  sendSuccess(res, room, 201);
});

export const getById: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  sendSuccess(res, await roomService.getRoomDetail(req.params.roomId ?? '', user.id));
});

export const updateTimer: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const { timerMinutes } = req.body as { timerMinutes: TimerOptionMinutes };
  sendSuccess(res, await roomService.updateTimer(req.params.roomId ?? '', user.id, timerMinutes));
});

export const listMembers: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  sendSuccess(res, await roomService.listMembers(req.params.roomId ?? '', user.id));
});

export const addMembers: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const { memberIds } = req.body as { memberIds: string[] };
  sendSuccess(res, await roomService.addMembers(req.params.roomId ?? '', user.id, memberIds));
});

export const removeMember: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const result = await roomService.removeMember(
    req.params.roomId ?? '',
    user.id,
    req.params.userId ?? '',
  );
  sendSuccess(res, result);
});

export const leave: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  sendSuccess(res, await roomService.leaveRoom(req.params.roomId ?? '', user.id));
});

/**
 * Public generated avatar for group rooms (user ids and room ids are UUIDs).
 * Rooms with an uploaded/custom avatar URL are served directly from that URL.
 */
export const getAvatar: RequestHandler = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomAvatarSource(req.params.roomId ?? '');
  if (room.avatarUrl) {
    throw ApiError.notFound('This room uses a custom avatar URL', 'NO_GENERATED_AVATAR');
  }

  res.setHeader('Cache-Control', 'public, max-age=300');
  res.type('image/svg+xml');
  res.send(createInitialsAvatar(room.name, room.id));
});
