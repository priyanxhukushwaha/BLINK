import type { Socket } from 'socket.io';
import { prisma } from '../config/database';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  SocketUser,
} from '../types/socket';
import { ApiError } from '../utils/ApiError';
import { buildAvatarUrl } from '../utils/links';
import { verifyAccessToken } from '../utils/tokens';

export type BlinkSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export async function resolveSocketUser(token: string): Promise<SocketUser> {
  const payload = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarPath: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'ACCOUNT_NOT_FOUND');
  }

  return {
    id: user.id,
    username: `@${user.username}`,
    displayName: user.displayName,
    avatarUrl: buildAvatarUrl(user),
  };
}

export function requireSocketUser(socket: BlinkSocket): SocketUser {
  if (!socket.data.user) {
    throw ApiError.unauthorized('Authenticate the socket first', 'NOT_AUTHENTICATED');
  }
  return socket.data.user;
}
