import type { RequestHandler } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getUser } from '../../middleware/authenticate';
import * as inviteService from './invite.service';

export const getLink: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const link = await inviteService.getInviteLink(user.id);
  sendSuccess(res, link);
});

export const accept: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const result = await inviteService.acceptInvite(user.id, req.params.inviteCode ?? '');
  sendSuccess(res, result);
});
