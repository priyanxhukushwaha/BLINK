import { z } from 'zod';
import { assertRoomMembership } from '../../modules/rooms/room.service';
import { ApiError } from '../../utils/ApiError';
import { SOCKET_LIMITS, WS_EVENTS } from '../../utils/constants';
import { emitToRoom } from '../realtime';
import { requireSocketUser, type BlinkSocket } from '../socket.auth';
import { SocketRateLimiter, errorResponse } from '../socket.util';

const screenshotPayloadSchema = z.object({
  roomId: z.string().uuid(),
  source: z.enum(['shortcut', 'mobile_visibility']),
});

export function registerScreenshotEvents(socket: BlinkSocket): void {
  const limiter = new SocketRateLimiter(SOCKET_LIMITS.screenshotPerMinute);
  const lastReportedAt = new Map<string, number>();

  socket.on(WS_EVENTS.REPORT_SCREENSHOT, (payload, ack) => {
    void (async () => {
      const user = requireSocketUser(socket);
      if (!limiter.allow()) {
        throw ApiError.tooManyRequests();
      }

      const parsed = screenshotPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        throw ApiError.badRequest('Invalid screenshot alert', 'VALIDATION_ERROR');
      }

      const { roomId, source } = parsed.data;
      await assertRoomMembership(roomId, user.id);

      const now = Date.now();
      if (now - (lastReportedAt.get(roomId) ?? 0) < SOCKET_LIMITS.screenshotMinIntervalMs) {
        throw ApiError.tooManyRequests();
      }
      lastReportedAt.set(roomId, now);

      emitToRoom(roomId, WS_EVENTS.SCREENSHOT_TAKEN, {
        roomId,
        userId: user.id,
        displayName: user.displayName,
        source,
        occurredAt: now,
      });
      ack?.({ ok: true });
    })().catch((error: unknown) => ack?.(errorResponse(error)));
  });
}
