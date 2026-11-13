/**
 * Product invariants. These are deliberately not environment-configurable:
 * a 60 minute ceiling is part of BLINK's privacy promise.
 */
export const TIMER_OPTIONS = [1, 5, 15, 30, 60] as const;
export type TimerOptionMinutes = (typeof TIMER_OPTIONS)[number];

export const DEFAULT_TIMER_MINUTES: TimerOptionMinutes = 15;
export const MAX_MESSAGE_LIFETIME_MS = 60 * 60 * 1000;

export const MIN_GROUP_MEMBERS = 2;
export const MAX_GROUP_MEMBERS = 50;
export const PRIVATE_ROOM_MEMBERS = 2;

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 20;
export const MAX_DISPLAY_NAME_LENGTH = 50;
export const MAX_BIO_LENGTH = 280;
export const MAX_GROUP_NAME_LENGTH = 80;
export const MAX_MESSAGE_LENGTH = 4000;

export const MAX_PHOTO_DIMENSION = 1600;
export const MAX_AVATAR_DIMENSION = 512;
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Uploaded photos are addressable for this long before being attached to a message. */
export const MEDIA_UPLOAD_TTL_MS = 10 * 60 * 1000;
export const MEDIA_UPLOAD_URL_PREFIX = '/api/uploads';

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 50;

export const WS_EVENTS = {
  AUTHENTICATE: 'ws:authenticate',
  JOIN_ROOM: 'ws:join_room',
  LEAVE_ROOM: 'ws:leave_room',
  SEND_MESSAGE: 'ws:send_message',
  MARK_READ: 'ws:mark_read',
  TYPING: 'ws:typing',
  AUTHENTICATED: 'ws:authenticated',
  NEW_MESSAGE: 'ws:new_message',
  MESSAGE_READ: 'ws:message_read',
  MESSAGE_EXPIRED: 'ws:message_expired',
  MESSAGE_DELETED: 'ws:message_deleted',
  ROOM_TIMER_UPDATED: 'ws:room_timer_updated',
  MEMBER_JOINED: 'ws:member_joined',
  MEMBER_LEFT: 'ws:member_left',
  NOTIFICATION: 'ws:notification',
} as const;

export const WS_AUTH_TIMEOUT_MS = 5000;

export const SOCKET_LIMITS = {
  sendMessagePerMinute: 30,
  markReadPerMinute: 60,
  joinRoomPerMinute: 60,
  typingPerMinute: 60,
  typingMinIntervalMs: 1000,
} as const;

export function isTimerOption(value: number): value is TimerOptionMinutes {
  return (TIMER_OPTIONS as readonly number[]).includes(value);
}
