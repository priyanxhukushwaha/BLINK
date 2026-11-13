import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { buildInviteLink } from '../../utils/links';
import { createNotification } from '../notifications/notification.service';
import { publicUserSelect, toPublicUser, type PublicUserDto } from '../users/user.types';

export interface InviteLinkDto {
  inviteCode: string;
  inviteLink: string;
}

export async function getInviteLink(userId: string): Promise<InviteLinkDto> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { inviteCode: true } });
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'ACCOUNT_NOT_FOUND');
  }

  return {
    inviteCode: user.inviteCode,
    inviteLink: buildInviteLink(user.inviteCode),
  };
}

export async function acceptInvite(
  userId: string,
  inviteCode: string,
): Promise<{ friend: PublicUserDto; alreadyFriends: boolean }> {
  const [inviter, currentUser] = await Promise.all([
    prisma.user.findUnique({ where: { inviteCode }, select: publicUserSelect }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, displayName: true } }),
  ]);

  if (!inviter) {
    throw ApiError.notFound('This invite link is invalid or has expired', 'INVALID_INVITE');
  }
  if (inviter.id === userId) {
    throw ApiError.badRequest('You cannot accept your own invite', 'OWN_INVITE');
  }
  if (!currentUser) {
    throw ApiError.unauthorized('Account no longer exists', 'ACCOUNT_NOT_FOUND');
  }

  const existing = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId, friendId: inviter.id } },
    select: { id: true },
  });

  if (existing) {
    return { friend: toPublicUser(inviter), alreadyFriends: true };
  }

  await prisma.$transaction([
    prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId: inviter.id } },
      create: { userId, friendId: inviter.id },
      update: {},
    }),
    prisma.friendship.upsert({
      where: { userId_friendId: { userId: inviter.id, friendId: userId } },
      create: { userId: inviter.id, friendId: userId },
      update: {},
    }),
  ]);

  await createNotification({
    userId: inviter.id,
    type: 'FRIEND_ACCEPTED',
    title: 'New friend on BLINK',
    body: `${currentUser.displayName} is now in your circle.`,
    data: { userId },
  });

  return { friend: toPublicUser(inviter), alreadyFriends: false };
}
