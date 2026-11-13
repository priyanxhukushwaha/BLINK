import type { AuthSessionDto } from './types';

const configuredBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
export const API_BASE_URL = (configuredBase || 'http://localhost:5000').replace(/\/+$/, '');

const REFRESH_TOKEN_KEY = 'blink.refresh_token';

let accessToken: string | null = null;
let refreshPromise: Promise<AuthSessionDto> | null = null;
let authExpiredHandler: (() => void) | null = null;

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = 'REQUEST_FAILED', status = 0) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // Session storage can be unavailable in hardened browsers; the in-memory
    // access token still works for the current tab.
  }
}

export function clearTokens(): void {
  accessToken = null;
  setRefreshToken(null);
}

export function setAuthExpiredHandler(handler: (() => void) | null): void {
  authExpiredHandler = handler;
}

export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
  retryOnUnauthorized?: boolean;
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { success: true; data: T }
    | { success: false; error?: { code?: string; message?: string } }
    | null;

  if (!response.ok || !payload || payload.success !== true) {
    const error = payload && payload.success === false ? payload.error : undefined;
    throw new ApiRequestError(
      error?.message || `Request failed (${response.status})`,
      error?.code || 'REQUEST_FAILED',
      response.status
    );
  }

  return payload.data;
}

export async function refreshSession(): Promise<AuthSessionDto> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new ApiRequestError('Please sign in to continue.', 'NOT_AUTHENTICATED', 401);
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    let session: AuthSessionDto;
    try {
      session = await parseEnvelope<AuthSessionDto>(response);
    } catch (error) {
      clearTokens();
      authExpiredHandler?.();
      throw error;
    }

    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    return session;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const execute = (): Promise<Response> => {
    const headers: Record<string, string> = { ...authHeader() };
    let body: BodyInit | undefined;

    if (options.formData) {
      body = options.formData;
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    return fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
    });
  };

  let response = await execute();

  // Only authenticated requests can be refreshed. Login/register 401s keep
  // their own backend message instead of becoming "session expired".
  if (
    response.status === 401 &&
    options.retryOnUnauthorized !== false &&
    Boolean(getAccessToken()) &&
    Boolean(getRefreshToken())
  ) {
    try {
      await refreshSession();
    } catch {
      throw new ApiRequestError('Your session expired. Please sign in again.', 'SESSION_EXPIRED', 401);
    }
    response = await execute();
  }

  return parseEnvelope<T>(response);
}

/** Downloads a token-protected resource (message photo) and returns a blob URL. */
export async function fetchObjectUrl(path: string): Promise<string> {
  const execute = (): Promise<Response> =>
    fetch(mediaUrl(path), { headers: authHeader() });

  let response = await execute();
  if (response.status === 401) {
    await refreshSession();
    response = await execute();
  }

  if (!response.ok) {
    throw new ApiRequestError('Attachment is no longer available', 'ATTACHMENT_UNAVAILABLE', response.status);
  }

  return URL.createObjectURL(await response.blob());
}
