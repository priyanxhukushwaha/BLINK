import type { RequestHandler } from 'express';
import fs from 'node:fs';
import { sendSuccess } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { asyncHandler } from '../../utils/asyncHandler';
import { getUser } from '../../middleware/authenticate';
import * as messageService from './message.service';
import * as uploadService from '../uploads/upload.service';
import type { ListMessagesQuery, SendMessageInput } from './message.validator';

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const page = await messageService.listMessages(
    req.params.roomId ?? '',
    user.id,
    req.query as unknown as ListMessagesQuery,
  );
  sendSuccess(res, page);
});

export const send: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const message = await messageService.sendMessage(
    req.params.roomId ?? '',
    user.id,
    req.body as SendMessageInput,
  );
  sendSuccess(res, message, 201);
});

export const markRead: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  sendSuccess(res, await messageService.markRoomRead(req.params.roomId ?? '', user.id));
});

export const remove: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const result = await messageService.deleteMessage(
    req.params.roomId ?? '',
    req.params.messageId ?? '',
    user.id,
  );
  sendSuccess(res, result);
});

/**
 * Photos require a bearer token, so clients should fetch them into a blob URL
 * rather than pointing an <img> at this route directly.
 */
export const getPhoto: RequestHandler = asyncHandler(async (req, res, next) => {
  const user = getUser(req);
  const photo = await messageService.getMessagePhoto(
    req.params.roomId ?? '',
    req.params.messageId ?? '',
    user.id,
  );

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.type(photo.mimeType);

  const stream = fs.createReadStream(photo.absolutePath);
  stream.on('error', () => {
    next(ApiError.notFound('Photo is no longer available', 'PHOTO_NOT_FOUND'));
  });
  stream.pipe(res);
});

export const uploadPhoto: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  if (!req.file) {
    throw ApiError.badRequest('Attach an image in the "photo" field', 'FILE_REQUIRED');
  }

  const result = await uploadService.createRoomPhotoUpload(
    req.params.roomId ?? '',
    user.id,
    req.file,
  );
  sendSuccess(res, result, 201);
});
