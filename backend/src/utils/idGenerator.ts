import crypto from 'node:crypto';

export function randomId(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function randomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** URL-safe invite code (12 characters). */
export function generateInviteCode(): string {
  return crypto.randomBytes(9).toString('base64url');
}
