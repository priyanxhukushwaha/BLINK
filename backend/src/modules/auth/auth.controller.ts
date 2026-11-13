import type { RequestHandler } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getUser } from '../../middleware/authenticate';
import * as authService from './auth.service';
import * as userService from '../users/user.service';
import type { LoginInput, RefreshTokenInput, RegisterInput } from './auth.validator';

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const session = await authService.register(req.body as RegisterInput);
  sendSuccess(res, session, 201);
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const session = await authService.login(req.body as LoginInput);
  sendSuccess(res, session);
});

export const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body as RefreshTokenInput;
  const result = await authService.refresh(refreshToken);
  sendSuccess(res, {
    user: await userService.getOwnProfile(result.user.id),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body as RefreshTokenInput;
  await authService.logout(refreshToken);
  sendSuccess(res, { loggedOut: true });
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const user = getUser(req);
  const profile = await userService.getOwnProfile(user.id);
  sendSuccess(res, profile);
});
