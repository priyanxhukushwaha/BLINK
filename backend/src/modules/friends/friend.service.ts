import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { createNotification } from '../notifications/notification.service';
import { publicUserSelect, toPublicUser, type PublicUserDto } from '../users/user.types';
import {
  friendRequestInclude,
  toFriendRequestDto,
  type FriendDto,
  type FriendRequestDto,
} from './friend.types';

export async function listFriends(userId: string): Promise<FriendDto[]> {
  const friendships = await prisma.friendship.findMany({
    where: { userId },
    include: { friend: { select: publicUserSelect } },
    orderBy: { createdAt: 'desc' },
  });

  if (friendships.length === 0) {
    return [];
  }

  const friendIds = new Set(friendships.map((friendship) => friendship.friendId));

  const rooms = await prisma.room.findMany({
    where: { type: 'PRIVATE', members: { some: { userId } } },
    include: {
      members: { select: { userId: true } },
      messages: {
        where: { expiresAt: { gt: new Date() } },
        take: 1,
        orderBy: { sentAt: 'desc' },
        select: { text: true, photoPath: true },
      },
    },
  });

  const roomIds = rooms.map((room) => room.id);
  const unreadGroups = roomIds.length
    ? await prisma.message.groupBy({
        by: ['roomId'],
        where: {
          roomId: { in: roomIds },
          senderId: { not: userId },
          reads: { none: { userId } },
        },
        _count: { _all: true },
      })
    : [];

  const unreadByRoom = new Map(unreadGroups.map((group) => [group.roomId, group._count._all]));
  const roomByFriend = new Map<string, (typeof rooms)[number]>();

  for (const room of rooms) {
    const other = room.members.find((member) => member.userId !== userId);
    if (other && friendIds.has(other.userId)) {
      roomByFriend.set(other.userId, room);
    }
  }

  return friendships.map((friendship) => {
    const room = roomByFriend.get(friendship.friendId);
    const lastMessage = room?.messages[0];
    const lastInteractionText = lastMessage
      ? lastMessage.text || (lastMessage.photoPath ? 'Photo' : '')
      : 'Tap to chat';

    return {
      ...toPublicUser(friendship.friend),
      lastInteractionText,
      unreadCount: room ? (unreadByRoom.get(room.id) ?? 0) : 0,
    };
  });
}

export async function sendRequest(senderId: string, receiverId: string): Promise<FriendRequestDto> {
  if (senderId === receiverId) {
    throw ApiError.badRequest('You cannot add yourself', 'SELF_FRIEND_REQUEST');
  }

  const [receiver, existingFriendship] = await Promise.all([
    prisma.user.findUnique({ where: { id: receiverId }, select: publicUserSelect }),
    prisma.friendship.findUnique({
      where: { userId_friendId: { userId: senderId, friendId: receiverId } },
      select: { id: true },
    }),
  ]);

  if (!receiver) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }
  if (existingFriendship) {
    throw ApiError.conflict('You are already friends', 'ALREADY_FRIENDS');
  }

  const reverse = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
    select: { id: true, status: true },
  });

  if (reverse?.status === 'PENDING') {
    throw ApiError.conflict(
      'This person already sent you a friend request — accept it instead',
      'INCOMING_REQUEST_EXISTS',
    );
  }

  const outgoing = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId, receiverId } },
    select: { id: true },
  });

  const request = outgoing
    ? await prisma.friendRequest.update({
        where: { id: outgoing.id },
        data: { status: 'PENDING' },
        include: friendRequestInclude,
      })
    : await prisma.friendRequest.create({
        data: { senderId, receiverId },
        include: friendRequestInclude,
      });

  await createNotification({
    userId: receiverId,
    type: 'FRIEND_REQUEST',
    title: 'New friend request',
    body: `${request.sender.displayName} wants to connect on BLINK.`,
    data: { requestId: request.id, userId: senderId },
  });

  return toFriendRequestDto(request);
}

export async function acceptRequest(
  requestId: string,
  userId: string,
): Promise<{ requestId: string; status: 'ACCEPTED'; friend: PublicUserDto }> {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: friendRequestInclude,
  });

  if (!request || request.receiverId !== userId) {
    throw ApiError.notFound('Friend request not found', 'REQUEST_NOT_FOUND');
  }
  if (request.status !== 'PENDING') {
    throw ApiError.conflict('This friend request is no longer pending', 'REQUEST_NOT_PENDING');
  }

  await prisma.$transaction([
    prisma.friendRequest.update({ where: { id: request.id }, data: { status: 'ACCEPTED' } }),
    prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId: request.senderId } },
      create: { userId, friendId: request.senderId },
      update: {},
    }),
    prisma.friendship.upsert({
      where: { userId_friendId: { userId: request.senderId, friendId: userId } },
      create: { userId: request.senderId, friendId: userId },
      update: {},
    }),
  ]);

  await createNotification({
    userId: request.senderId,
    type: 'FRIEND_ACCEPTED',
    title: 'Friend request accepted',
    body: `${request.receiver.displayName} accepted your friend request.`,
    data: { userId },
  });

  return { requestId: request.id, status: 'ACCEPTED', friend: toPublicUser(request.sender) };
}

export async function rejectRequest(requestId: string, userId: string): Promise<{ requestId: string; status: 'REJECTED' }> {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    select: { id: true, receiverId: true, status: true },
  });

  if (!request || request.receiverId !== userId) {
    throw ApiError.notFound('Friend request not found', 'REQUEST_NOT_FOUND');
  }
  if (request.status !== 'PENDING') {
    throw ApiError.conflict('This friend request is no longer pending', 'REQUEST_NOT_PENDING');
  }

  await prisma.friendRequest.update({ where: { id: request.id }, data: { status: 'REJECTED' } });
  return { requestId: request.id, status: 'REJECTED' };
}

export async function removeFriend(userId: string, friendId: string): Promise<{ removed: true }> {
  const result = await prisma.friendship.deleteMany({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });

  if (result.count === 0) {
    throw ApiError.notFound('Friendship not found', 'FRIENDSHIP_NOT_FOUND');
  }

  return { removed: true };
}

export async function listRequests(
  userId: string,
): Promise<{ incoming: FriendRequestDto[]; outgoing: FriendRequestDto[] }> {
  const [incoming, outgoing] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: friendRequestInclude,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendRequest.findMany({
      where: { senderId: userId, status: 'PENDING' },
      include: friendRequestInclude,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    incoming: incoming.map(toFriendRequestDto),
    outgoing: outgoing.map(toFriendRequestDto),
  };
}

export async function areFriends(userId: string, otherUserId: string): Promise<boolean> {
  const friendship = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId, friendId: otherUserId } },
    select: { id: true },
  });
  return Boolean(friendship);
}
