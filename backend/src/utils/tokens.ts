import crypto from 'node:crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from './ApiError';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  username: string;
  type: 'access';
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

const accessOptions: SignOptions = {
  expiresIn: config.jwt.accessExpiry as unknown as SignOptions['expiresIn'],
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
};

const refreshOptions: SignOptions = {
  expiresIn: config.jwt.refreshExpiry as unknown as SignOptions['expiresIn'],
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
};

function resolveExpiry(token: string): Date {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string' || typeof decoded.exp !== 'number') {
    throw new Error('Issued token has no expiry claim');
  }
  return new Date(decoded.exp * 1000);
}

export function signAccessToken(user: { id: string; username: string }): { token: string; expiresAt: Date } {
  const token = jwt.sign(
    { sub: user.id, username: user.username, type: 'access' },
    config.jwt.accessSecret,
    accessOptions,
  );
  return { token, expiresAt: resolveExpiry(token) };
}

export function signRefreshToken(userId: string): { token: string; jti: string; expiresAt: Date } {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: userId, jti, type: 'refresh' }, config.jwt.refreshSecret, refreshOptions);
  return { token, jti, expiresAt: resolveExpiry(token) };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    if (typeof payload === 'string' || payload.type !== 'access' || typeof payload.sub !== 'string') {
      throw ApiError.unauthorized('Invalid access token', 'INVALID_TOKEN');
    }
    return payload as AccessTokenPayload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized('Invalid or expired access token', 'INVALID_TOKEN');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    if (
      typeof payload === 'string' ||
      payload.type !== 'refresh' ||
      typeof payload.sub !== 'string' ||
      typeof payload.jti !== 'string'
    ) {
      throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }
    return payload as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }
}

/** Refresh tokens are stored as SHA-256 hashes, never in plaintext. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function timingSafeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}
