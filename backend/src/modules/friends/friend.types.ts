import type { FriendRequestStatus, Prisma } from '@prisma/client';
import { publicUserSelect, toPublicUser, type PublicUserDto } from '../users/user.types';

export const friendRequestInclude = {
  sender: { select: publicUserSelect },
  receiver: { select: publicUserSelect },
} satisfies Prisma.FriendRequestInclude;

export type FriendRequestRow = Prisma.FriendRequestGetPayload<{ include: typeof friendRequestInclude }>;

export interface FriendDto extends PublicUserDto {
  lastInteractionText: string;
  unreadCount: number;
}

export interface FriendRequestDto {
  id: string;
  status: FriendRequestStatus;
  createdAt: number;
  sender: PublicUserDto;
  receiver: PublicUserDto;
}

export function toFriendRequestDto(request: FriendRequestRow): FriendRequestDto {
  return {
    id: request.id,
    status: request.status,
    createdAt: request.createdAt.getTime(),
    sender: toPublicUser(request.sender),
    receiver: toPublicUser(request.receiver),
  };
}
