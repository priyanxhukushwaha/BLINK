import type { RequestHandler } from 'express';
import { sendError } from '../utils/apiResponse';

export const notFound: RequestHandler = (req, res) => {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
};
