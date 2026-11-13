import fs from 'node:fs';
import type { RequestHandler } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { asyncHandler } from '../../utils/asyncHandler';
import { getUser } from '../../middleware/authenticate';
import { createInitialsAvatar } from '../../services/storage.service';
import * as userService from './user.service';
import type { SearchUsersQuery, UpdateProfileInput } from './user.validator';

export const getMe: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const profile = await userService.getOwnProfile(user.id);
  sendSuccess(res, profile);
});

export const updateMe: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const profile = await userService.updateOwnProfile(user.id, req.body as UpdateProfileInput);
  sendSuccess(res, profile);
});

export const getUserById: RequestHandler = asyncHandler(async (req, res) => {
  const profile = await userService.getPublicProfile(req.params.userId ?? '');
  sendSuccess(res, profile);
});

export const search: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const results = await userService.searchUsers(user.id, req.query as unknown as SearchUsersQuery);
  sendSuccess(res, results);
});

export const uploadAvatar: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  if (!req.file) {
    throw ApiError.badRequest('Attach an image in the "photo" field', 'FILE_REQUIRED');
  }
  const profile = await userService.updateAvatar(user.id, req.file);
  sendSuccess(res, profile);
});

/**
 * Avatars are intentionally public: <img> tags cannot attach bearer tokens and
 * a profile image is not private data. User ids are unguessable UUIDs.
 */
export const getAvatar: RequestHandler = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId ?? '';
  const { displayName, row } = await userService.getAvatarSource(userId);
  if (!row) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }

  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const avatar = await userService.getAvatarFile(userId);
  if (!avatar) {
    res.type('image/svg+xml');
    res.send(createInitialsAvatar(displayName, row.id));
    return;
  }

  res.type(avatar.mimeType);
  const stream = fs.createReadStream(avatar.absolutePath);
  stream.on('error', next);
  stream.pipe(res);
});
