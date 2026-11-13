import { z } from 'zod';
import { SOCKET_LIMITS, WS_EVENTS } from '../../utils/constants';
import { roomChannel } from '../realtime';
import { requireSocketUser, type BlinkSocket } from '../socket.auth';

const typingPayloadSchema = z.object({ roomId: z.string().uuid() });

export function registerTypingEvents(socket: BlinkSocket): void {
  const lastSentAt = new Map<string, number>();

  socket.on(WS_EVENTS.TYPING, (payload) => {
    void (async () => {
      const user = requireSocketUser(socket);
      const parsed = typingPayloadSchema.safeParse(payload);
      if (!parsed.success) return;

      const { roomId } = parsed.data;
      // Membership is reflected by the socket's joined channels.
      if (!socket.rooms.has(roomChannel(roomId))) return;

      const now = Date.now();
      if (now - (lastSentAt.get(roomId) ?? 0) < SOCKET_LIMITS.typingMinIntervalMs) return;
      lastSentAt.set(roomId, now);

      socket.to(roomChannel(roomId)).emit(WS_EVENTS.TYPING, {
        roomId,
        userId: user.id,
        username: user.username,
      });
    })().catch(() => undefined);
  });
}
