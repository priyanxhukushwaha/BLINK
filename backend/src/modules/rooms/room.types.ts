import type { MemberRole, Prisma, RoomType } from '@prisma/client';
import type { TimerOptionMinutes } from '../../utils/constants';
import { buildAvatarUrl, buildRoomAvatarUrl } from '../../utils/links';
import { publicUserSelect, toPublicUser, type PublicUserDto } from '../users/user.types';

export const roomMemberInclude = {
  user: { select: publicUserSelect },
} satisfies Prisma.RoomMemberInclude;

export type RoomMemberRow = Prisma.RoomMemberGetPayload<{ include: typeof roomMemberInclude }>;

export interface RoomMemberUser extends PublicUserDto {}

export interface RoomMemberDto extends PublicUserDto {
  role: MemberRole;
  joinedAt: number;
}

/**
 * Structural shape of a room with its members and newest message. Prisma
 * results with the matching include are directly assignable.
 */
export interface RoomSummary {
  id: string;
  name: string;
  type: RoomType;
  avatarUrl: string | null;
  timerMinutes: number;
  adminId: string | null;
  updatedAt: Date;
  members: RoomMemberRow[];
  messages: Array<{ text: string; photoPath: string | null }>;
}

export interface RoomDto {
  id: string;
  name: string;
  type: 'private' | 'group';
  avatarUrl: string;
  memberCount: number;
  /** Member user ids, matching the frontend ConversationRoom.members contract. */
  members: string[];
  adminId?: string;
  adminName?: string;
  lastMessageText: string;
  timerMinutes: TimerOptionMinutes;
  recipientId?: string;
  unreadCount: number;
}

export interface RoomDetailDto {
  room: RoomDto;
  members: RoomMemberDto[];
}

export function toRoomMemberDto(member: RoomMemberRow): RoomMemberDto {
  return {
    ...toPublicUser(member.user),
    role: member.role,
    joinedAt: member.joinedAt.getTime(),
  };
}

export function toRoomDto(room: RoomSummary, viewerId: string, unreadCount: number): RoomDto {
  const otherMember =
    room.type === 'PRIVATE' ? room.members.find((member) => member.userId !== viewerId) : undefined;
  const adminMember = room.adminId
    ? room.members.find((member) => member.userId === room.adminId)
    : undefined;
  const lastMessage = room.messages[0];

  const dto: RoomDto = {
    id: room.id,
    name: otherMember ? otherMember.user.displayName : room.name,
    type: room.type === 'PRIVATE' ? 'private' : 'group',
    avatarUrl: otherMember
      ? buildAvatarUrl(otherMember.user)
      : (room.avatarUrl ?? buildRoomAvatarUrl(room)),
    memberCount: room.members.length,
    members: room.members.map((member) => member.userId),
    lastMessageText: lastMessage ? lastMessage.text || (lastMessage.photoPath ? 'Photo' : '') : '',
    timerMinutes: room.timerMinutes as TimerOptionMinutes,
    unreadCount,
  };

  if (room.adminId) {
    dto.adminId = room.adminId;
  }
  if (adminMember) {
    dto.adminName = adminMember.user.displayName;
  }
  if (otherMember) {
    dto.recipientId = otherMember.userId;
  }

  return dto;
}
