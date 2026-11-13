export interface AuthUser {
  id: string;
  username: string;
}

export interface PaginationQuery {
  limit: number;
  before?: string;
}

export interface PageResult<T> {
  items: T[];
  hasMore: boolean;
}

export type AckResponse<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: { code: string; message: string } };
