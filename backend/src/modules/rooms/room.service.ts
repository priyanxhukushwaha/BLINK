import type { MemberRole, Prisma, Room } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { deleteStoredPhoto } from '../../services/storage.service';
import { ApiError } from '../../utils/ApiError';
import {
  DEFAULT_TIMER_MINUTES,
  MAX_GROUP_MEMBERS,
  MIN_GROUP_MEMBERS,
  WS_EVENTS,
  isTimerOption,
  type TimerOptionMinutes,
} from '../../utils/constants';
import { cleanSingleLine } from '../../utils/sanitize';
import { emitToRoom, joinUsersToRoom, removeUsersFromRoom } from '../../websocket/realtime';
import { createNotification } from '../notifications/notification.service';
import { publicUserSelect, toPublicUser } from '../users/user.types';
import {
  toRoomDto,
  toRoomMemberDto,
  type RoomDetailDto,
  type RoomDto,
  type RoomMemberDto,
  type RoomSummary,
} from './room.types';
import type { CreateGroupRoomInput } from './room.validator';

export interface RoomMembership {
  room: Room;
  role: MemberRole;
}

function roomSummaryInclude() {
  return {
    members: {
      include: { user: { select: publicUserSelect } },
      orderBy: { joinedAt: 'asc' as const },
    },
    messages: {
      // Never preview a message that has technically expired but has not been
      // swept yet (the sweeper runs every 30 seconds).
      where: { expiresAt: { gt: new Date() } },
      take: 1,
      orderBy: { sentAt: 'desc' as const },
      select: { text: true, photoPath: true },
    },
  } satisfies Prisma.RoomInclude;
}

async function getRoomSummary(roomId: string): Promise<RoomSummary> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: roomSummaryInclude(),
  });
  if (!room) {
    throw ApiError.notFound('Room not found', 'ROOM_NOT_FOUND');
  }
  return room;
}

async function countUnread(roomId: string, userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      roomId,
      senderId: { not: userId },
      expiresAt: { gt: new Date() },
      reads: { none: { userId } },
    },
  });
}

function buildDetail(room: RoomSummary, viewerId: string, unreadCount: number): RoomDetailDto {
  return {
    room: toRoomDto(room, viewerId, unreadCount),
    members: room.members.map(toRoomMemberDto),
  };
}

export async function assertRoomMembership(roomId: string, userId: string): Promise<RoomMembership> {
  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
    include: { room: true },
  });

  if (!membership) {
    throw ApiError.forbidden('You are not a member of this room', 'NOT_A_ROOM_MEMBER');
  }

  return { room: membership.room, role: membership.role };
}

export async function listRooms(userId: string): Promise<RoomDto[]> {
  const rooms = await prisma.room.findMany({
    where: { members: { some: { userId } } },
    include: roomSummaryInclude(),
    orderBy: { updatedAt: 'desc' },
  });

  if (rooms.length === 0) {
    return [];
  }

  const unreadGroups = await prisma.message.groupBy({
    by: ['roomId'],
    where: {
      roomId: { in: rooms.map((room) => room.id) },
      senderId: { not: userId },
      expiresAt: { gt: new Date() },
      reads: { none: { userId } },
    },
    _count: { _all: true },
  });

  const unreadByRoom = new Map(unreadGroups.map((group) => [group.roomId, group._count._all]));
  return rooms.map((room) => toRoomDto(room, userId, unreadByRoom.get(room.id) ?? 0));
}

export async function getRoomDetail(roomId: string, userId: string): Promise<RoomDetailDto> {
  await assertRoomMembership(roomId, userId);
  const room = await getRoomSummary(roomId);
  return buildDetail(room, userId, await countUnread(roomId, userId));
}

export async function createPrivateRoom(userId: string, recipientId: string): Promise<RoomDto> {
  if (userId === recipientId) {
    throw ApiError.badRequest('You cannot start a chat with yourself', 'SELF_CHAT');
  }

  const [creator, recipient, friendship] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, defaultTimerMinutes: true },
    }),
    prisma.user.findUnique({
      where: { id: recipientId },
      select: { ...publicUserSelect, defaultTimerMinutes: true },
    }),
    prisma.friendship.findUnique({
      where: { userId_friendId: { userId, friendId: recipientId } },
      select: { id: true },
    }),
  ]);

  if (!creator) {
    throw ApiError.unauthorized('Account no longer exists', 'ACCOUNT_NOT_FOUND');
  }
  if (!recipient) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }
  if (!friendship) {
    throw ApiError.forbidden('You can only start a private chat with a friend', 'NOT_FRIENDS');
  }

  // Sorted key makes the pair unique even if both users tap "message" at once.
  const dmKey = [userId, recipientId].sort().join(':');
  const existing = await prisma.room.findUnique({ where: { dmKey }, include: roomSummaryInclude() });
  if (existing) {
    return toRoomDto(existing, userId, await countUnread(existing.id, userId));
  }

  const timerMinutes: TimerOptionMinutes = isTimerOption(creator.defaultTimerMinutes)
    ? creator.defaultTimerMinutes
    : DEFAULT_TIMER_MINUTES;

  let room: RoomSummary;
  try {
    room = await prisma.room.create({
      data: {
        name: recipient.displayName,
        type: 'PRIVATE',
        dmKey,
        timerMinutes,
        members: {
          create: [
            { userId, role: 'MEMBER' },
            { userId: recipientId, role: 'MEMBER' },
          ],
        },
      },
      include: roomSummaryInclude(),
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      const raced = await prisma.room.findUnique({ where: { dmKey }, include: roomSummaryInclude() });
      if (raced) {
        return toRoomDto(raced, userId, await countUnread(raced.id, userId));
      }
    }
    throw error;
  }

  joinUsersToRoom([userId, recipientId], room.id);
  return toRoomDto(room, userId, 0);
}

export async function createGroupRoom(userId: string, input: CreateGroupRoomInput): Promise<RoomDetailDto> {
  const name = cleanSingleLine(input.name, 80);
  if (!name) {
    throw ApiError.badRequest('Group name cannot be empty', 'INVALID_GROUP_NAME');
  }

  const memberIds = [...new Set(input.memberIds)].filter((memberId) => memberId !== userId);
  const totalMembers = memberIds.length + 1;

  if (totalMembers < MIN_GROUP_MEMBERS) {
    throw ApiError.badRequest('Add at least one other member', 'GROUP_TOO_SMALL');
  }
  if (totalMembers > MAX_GROUP_MEMBERS) {
    throw ApiError.badRequest(`Groups can have at most ${MAX_GROUP_MEMBERS} members`, 'GROUP_TOO_LARGE');
  }

  const members = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: publicUserSelect,
  });
  if (members.length !== memberIds.length) {
    throw ApiError.badRequest('One or more members do not exist', 'INVALID_MEMBER');
  }

  const room = await prisma.room.create({
    data: {
      name,
      type: 'GROUP',
      avatarUrl: input.avatarUrl ?? null,
      timerMinutes: input.timerMinutes ?? DEFAULT_TIMER_MINUTES,
      adminId: userId,
      members: {
        create: [
          { userId, role: 'ADMIN' },
          ...memberIds.map((memberId) => ({ userId: memberId, role: 'MEMBER' as const })),
        ],
      },
    },
    include: roomSummaryInclude(),
  });

  joinUsersToRoom([userId, ...memberIds], room.id);

  const notifications = await Promise.allSettled(
    members.map((member) =>
      createNotification({
        userId: member.id,
        type: 'ROOM_INVITE',
        title: 'Added to a room',
        body: `You were added to ${name}.`,
        data: { roomId: room.id },
      }),
    ),
  );
  const failed = notifications.filter((result) => result.status === 'rejected').length;
  if (failed > 0) {
    logger.warn('Some room invite notifications failed', { roomId: room.id, failed });
  }

  return buildDetail(room, userId, 0);
}

export async function updateTimer(
  roomId: string,
  userId: string,
  timerMinutes: TimerOptionMinutes,
): Promise<RoomDto> {
  await assertRoomMembership(roomId, userId);

  const room = await prisma.room.update({
    where: { id: roomId },
    data: { timerMinutes },
    include: roomSummaryInclude(),
  });

  emitToRoom(roomId, WS_EVENTS.ROOM_TIMER_UPDATED, { roomId, timerMinutes });
  return toRoomDto(room, userId, await countUnread(roomId, userId));
}

export async function addMembers(
  roomId: string,
  actorId: string,
  memberIds: string[],
): Promise<RoomDetailDto> {
  const membership = await assertRoomMembership(roomId, actorId);
  if (membership.role !== 'ADMIN') {
    throw ApiError.forbidden('Only the room admin can add members', 'ADMIN_ONLY');
  }
  if (membership.room.type !== 'GROUP') {
    throw ApiError.badRequest('Only group rooms accept additional members', 'NOT_A_GROUP');
  }

  const uniqueIds = [...new Set(memberIds)].filter((memberId) => memberId !== actorId);
  if (uniqueIds.length === 0) {
    throw ApiError.badRequest('Add at least one member', 'NO_MEMBERS');
  }

  const currentCount = await prisma.roomMember.count({ where: { roomId } });
  if (currentCount + uniqueIds.length > MAX_GROUP_MEMBERS) {
    throw ApiError.badRequest(`Groups can have at most ${MAX_GROUP_MEMBERS} members`, 'GROUP_TOO_LARGE');
  }

  const existing = await prisma.roomMember.findMany({
    where: { roomId, userId: { in: uniqueIds } },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((row) => row.userId));
  const toAdd = uniqueIds.filter((memberId) => !existingIds.has(memberId));

  if (toAdd.length === 0) {
    throw ApiError.conflict('Those users are already members', 'ALREADY_MEMBERS');
  }

  const users = await prisma.user.findMany({
    where: { id: { in: toAdd } },
    select: publicUserSelect,
  });
  if (users.length !== toAdd.length) {
    throw ApiError.badRequest('One or more users do not exist', 'INVALID_MEMBER');
  }

  await prisma.roomMember.createMany({
    data: toAdd.map((memberId) => ({ roomId, userId: memberId, role: 'MEMBER' as const })),
  });

  joinUsersToRoom(toAdd, roomId);
  for (const added of users) {
    emitToRoom(roomId, WS_EVENTS.MEMBER_JOINED, { roomId, user: toPublicUser(added) });
  }

  await Promise.allSettled(
    users.map((added) =>
      createNotification({
        userId: added.id,
        type: 'ROOM_INVITE',
        title: 'Added to a room',
        body: `You were added to ${membership.room.name}.`,
        data: { roomId },
      }),
    ),
  );

  return getRoomDetail(roomId, actorId);
}

export async function removeMember(
  roomId: string,
  actorId: string,
  targetUserId: string,
): Promise<{ removed: true }> {
  const membership = await assertRoomMembership(roomId, actorId);
  if (membership.role !== 'ADMIN') {
    throw ApiError.forbidden('Only the room admin can remove members', 'ADMIN_ONLY');
  }
  if (membership.room.type !== 'GROUP') {
    throw ApiError.badRequest('Only group members can be removed', 'NOT_A_GROUP');
  }
  if (targetUserId === actorId) {
    throw ApiError.badRequest('Use the leave endpoint to exit a room', 'CANNOT_REMOVE_SELF');
  }

  const target = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: targetUserId } },
    select: { id: true },
  });
  if (!target) {
    throw ApiError.notFound('That user is not a member of this room', 'MEMBER_NOT_FOUND');
  }

  await prisma.$transaction([
    prisma.roomMember.delete({ where: { id: target.id } }),
    prisma.messageRead.deleteMany({ where: { userId: targetUserId, message: { roomId } } }),
  ]);

  removeUsersFromRoom([targetUserId], roomId);
  emitToRoom(roomId, WS_EVENTS.MEMBER_LEFT, { roomId, userId: targetUserId });
  return { removed: true };
}

export async function leaveRoom(
  roomId: string,
  userId: string,
): Promise<{ left: true; roomDeleted: boolean }> {
  const membership = await assertRoomMembership(roomId, userId);
  if (membership.room.type !== 'GROUP') {
    throw ApiError.badRequest('Private chats cannot be left', 'PRIVATE_ROOM');
  }

  const others = await prisma.roomMember.findMany({
    where: { roomId, userId: { not: userId } },
    orderBy: { joinedAt: 'asc' },
    select: { id: true, userId: true },
  });

  removeUsersFromRoom([userId], roomId);

  if (others.length === 0) {
    // Last member left: destroy the room and every photo it still holds.
    const photos = await prisma.message.findMany({ where: { roomId }, select: { photoPath: true } });
    await Promise.all(photos.map((message) => deleteStoredPhoto(message.photoPath)));
    await prisma.room.delete({ where: { id: roomId } });
    return { left: true, roomDeleted: true };
  }

  const successor = others[0];

  await prisma.$transaction(async (tx) => {
    await tx.roomMember.delete({ where: { roomId_userId: { roomId, userId } } });
    if (membership.role === 'ADMIN') {
      await tx.roomMember.update({ where: { id: successor.id }, data: { role: 'ADMIN' } });
      await tx.room.update({ where: { id: roomId }, data: { adminId: successor.userId } });
    }
  });

  emitToRoom(roomId, WS_EVENTS.MEMBER_LEFT, { roomId, userId });
  return { left: true, roomDeleted: false };
}

export async function listMembers(roomId: string, userId: string): Promise<RoomMemberDto[]> {
  await assertRoomMembership(roomId, userId);

  const members = await prisma.roomMember.findMany({
    where: { roomId },
    include: { user: { select: publicUserSelect } },
    orderBy: { joinedAt: 'asc' },
  });

  return members.map(toRoomMemberDto);
}

export async function getRoomAvatarSource(
  roomId: string,
): Promise<{ id: string; name: string; type: string; avatarUrl: string | null }> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, name: true, type: true, avatarUrl: true },
  });
  if (!room) {
    throw ApiError.notFound('Room not found', 'ROOM_NOT_FOUND');
  }
  return room;
}
