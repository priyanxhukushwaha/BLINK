import type { RequestHandler } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getUser } from '../../middleware/authenticate';
import * as friendService from './friend.service';

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  sendSuccess(res, await friendService.listFriends(user.id));
});

export const sendRequest: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const { userId } = req.body as { userId: string };
  sendSuccess(res, await friendService.sendRequest(user.id, userId), 201);
});

export const accept: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  sendSuccess(res, await friendService.acceptRequest(req.params.requestId ?? '', user.id));
});

export const reject: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  sendSuccess(res, await friendService.rejectRequest(req.params.requestId ?? '', user.id));
});

export const remove: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  sendSuccess(res, await friendService.removeFriend(user.id, req.params.friendId ?? ''));
});

export const listRequests: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  sendSuccess(res, await friendService.listRequests(user.id));
});
