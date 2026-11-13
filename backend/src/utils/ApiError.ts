export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST', details?: unknown): ApiError {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'You do not have access to this resource', code = 'FORBIDDEN'): ApiError {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND'): ApiError {
    return new ApiError(404, message, code);
  }

  static conflict(message = 'Resource already exists', code = 'CONFLICT'): ApiError {
    return new ApiError(409, message, code);
  }

  static payloadTooLarge(message = 'File is too large', code = 'PAYLOAD_TOO_LARGE'): ApiError {
    return new ApiError(413, message, code);
  }

  static unsupportedMedia(message = 'Unsupported media type', code = 'UNSUPPORTED_MEDIA_TYPE'): ApiError {
    return new ApiError(415, message, code);
  }

  static tooManyRequests(message = 'Too many requests, slow down', code = 'RATE_LIMITED'): ApiError {
    return new ApiError(429, message, code);
  }

  static internal(message = 'Something went wrong', code = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(500, message, code);
  }
}
