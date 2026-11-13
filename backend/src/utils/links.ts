import { config } from '../config';
import { MEDIA_UPLOAD_URL_PREFIX } from './constants';

export function buildInviteLink(inviteCode: string): string {
  return `${config.publicAppUrl}/invite/${inviteCode}`;
}

export function buildAvatarUrl(user: { id: string; updatedAt: Date }): string {
  return `/api/users/${user.id}/avatar?v=${user.updatedAt.getTime()}`;
}

export function buildRoomAvatarUrl(room: { id: string; updatedAt: Date }): string {
  return `/api/rooms/${room.id}/avatar?v=${room.updatedAt.getTime()}`;
}

export function buildMessagePhotoUrl(roomId: string, messageId: string): string {
  return `/api/rooms/${roomId}/messages/${messageId}/photo`;
}

export function buildUploadPreviewUrl(uploadId: string): string {
  return `${MEDIA_UPLOAD_URL_PREFIX}/${uploadId}`;
}

const UPLOAD_PATH_PATTERN = /^\/api\/uploads\/([0-9a-fA-F-]{36})$/;

/**
 * Accepts either the relative upload URL returned by the upload endpoint or an
 * absolute URL on this API, and extracts the upload id. Anything else is
 * rejected so clients can never supply an arbitrary file path.
 */
export function parseUploadUrl(value: string): string | null {
  let pathname = value.trim();

  if (/^https?:\/\//i.test(pathname)) {
    try {
      pathname = new URL(pathname).pathname;
    } catch {
      return null;
    }
  }

  const match = UPLOAD_PATH_PATTERN.exec(pathname);
  return match?.[1] ?? null;
}

export function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}
