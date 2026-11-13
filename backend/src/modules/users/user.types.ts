import type { Prisma } from '@prisma/client';
import { buildAvatarUrl, buildInviteLink } from '../../utils/links';

export const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarPath: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUserRow = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export interface PublicUserDto {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
}

export interface UserProfileDto extends PublicUserDto {
  defaultTimerMinutes?: number;
  inviteLink?: string;
}

type ProfileSource = PublicUserRow & {
  defaultTimerMinutes: number;
  inviteCode: string;
};

export function toPublicUser(user: PublicUserRow): PublicUserDto {
  return {
    id: user.id,
    username: `@${user.username}`,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: buildAvatarUrl(user),
  };
}

export function toUserProfile(user: ProfileSource, options: { includePrivate?: boolean } = {}): UserProfileDto {
  const profile: UserProfileDto = toPublicUser(user);
  if (options.includePrivate) {
    profile.defaultTimerMinutes = user.defaultTimerMinutes;
    profile.inviteLink = buildInviteLink(user.inviteCode);
  }
  return profile;
}
