import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type { UploadedFile } from '../uploads/upload.types';
import { ApiError } from '../../utils/ApiError';
import { MAX_BIO_LENGTH, MAX_DISPLAY_NAME_LENGTH } from '../../utils/constants';
import { cleanMultiline, cleanSingleLine } from '../../utils/sanitize';
import { deleteStoredAvatar, processImage, resolveStoredFile } from '../../services/storage.service';
import { publicUserSelect, toPublicUser, toUserProfile, type PublicUserRow } from './user.types';
import type { SearchUsersQuery, UpdateProfileInput } from './user.validator';
import type { PublicUserDto, UserProfileDto } from './user.types';

const profileSelect = {
  ...publicUserSelect,
  defaultTimerMinutes: true,
  inviteCode: true,
} satisfies Prisma.UserSelect;

type ProfileRow = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

function toProfile(row: ProfileRow, includePrivate = false): UserProfileDto {
  return toUserProfile(
    {
      ...row,
      defaultTimerMinutes: row.defaultTimerMinutes,
      inviteCode: row.inviteCode,
    },
    { includePrivate },
  );
}

export async function getOwnProfile(userId: string): Promise<UserProfileDto> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: profileSelect });
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'ACCOUNT_NOT_FOUND');
  }
  return toProfile(user, true);
}

export async function getPublicProfile(userId: string): Promise<PublicUserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }
  return toPublicUser(user);
}

export async function searchUsers(viewerId: string, query: SearchUsersQuery): Promise<PublicUserDto[]> {
  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      OR: [
        { username: { contains: query.q.toLowerCase().replace(/^@/, ''), mode: 'insensitive' } },
        { displayName: { contains: query.q, mode: 'insensitive' } },
      ],
    },
    select: publicUserSelect,
    orderBy: { username: 'asc' },
    take: 20,
  });

  return users.map(toPublicUser);
}

export async function updateOwnProfile(userId: string, input: UpdateProfileInput): Promise<UserProfileDto> {
  const data: Prisma.UserUpdateInput = {};

  if (input.displayName !== undefined) {
    const displayName = cleanSingleLine(input.displayName, MAX_DISPLAY_NAME_LENGTH);
    if (!displayName) {
      throw ApiError.badRequest('Display name cannot be empty', 'INVALID_DISPLAY_NAME');
    }
    data.displayName = displayName;
  }

  if (input.bio !== undefined) {
    data.bio = cleanMultiline(input.bio, MAX_BIO_LENGTH);
  }

  if (input.defaultTimerMinutes !== undefined) {
    data.defaultTimerMinutes = input.defaultTimerMinutes;
  }

  const updated = await prisma.user.update({ where: { id: userId }, data, select: profileSelect });
  return toProfile(updated, true);
}

export async function updateAvatar(userId: string, file: UploadedFile): Promise<UserProfileDto> {
  const stored = await processImage(file.path, 'avatars');

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { avatarPath: true } });
  if (!existing) {
    throw ApiError.unauthorized('Account no longer exists', 'ACCOUNT_NOT_FOUND');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarPath: stored.filePath },
    select: profileSelect,
  });

  // The old avatar is removed only after the new one is committed.
  await deleteStoredAvatar(existing.avatarPath);

  return toProfile(updated, true);
}

export interface AvatarFile {
  absolutePath: string;
  mimeType: string;
}

export async function getAvatarFile(userId: string): Promise<AvatarFile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarPath: true },
  });
  if (!user || !user.avatarPath) {
    return null;
  }

  const extension = user.avatarPath.split('.').pop()?.toLowerCase();
  const mimeType =
    extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

  return {
    absolutePath: resolveStoredFile('avatars', user.avatarPath),
    mimeType,
  };
}

export async function getAvatarSource(userId: string): Promise<{ displayName: string; row: PublicUserRow | null }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  return { displayName: user?.displayName ?? '?', row: user };
}
