import type { Response } from 'express';

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(res: Response, data: T, status = 200, message?: string): Response {
  const body: ApiSuccessBody<T> = message ? { success: true, data, message } : { success: true, data };
  return res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: ApiErrorBody = {
    success: false,
    error: details === undefined ? { code, message } : { code, message, details },
  };
  return res.status(status).json(body);
}
