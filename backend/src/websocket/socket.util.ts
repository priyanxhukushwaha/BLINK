import { ApiError } from '../utils/ApiError';

export interface AckFailure {
  ok: false;
  error: { code: string; message: string };
}

export function errorResponse(error: unknown): AckFailure {
  if (error instanceof ApiError) {
    return { ok: false, error: { code: error.code, message: error.message } };
  }
  return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } };
}

/** Fixed-window, in-memory limiter scoped to a single socket. */
export class SocketRateLimiter {
  private windowStart = 0;
  private count = 0;

  constructor(
    private readonly max: number,
    private readonly windowMs = 60_000,
  ) {}

  allow(now = Date.now()): boolean {
    const window = Math.floor(now / this.windowMs);
    if (window !== this.windowStart) {
      this.windowStart = window;
      this.count = 0;
    }
    this.count += 1;
    return this.count <= this.max;
  }
}
