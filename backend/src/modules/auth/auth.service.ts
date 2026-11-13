import type { Prisma, User } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { generateInviteCode } from '../../utils/idGenerator';
import { hashPassword, verifyPassword } from '../../utils/password';
import { cleanSingleLine } from '../../utils/sanitize';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/tokens';
import { MAX_DISPLAY_NAME_LENGTH } from '../../utils/constants';
import { toUserProfile } from '../users/user.types';
import type { AuthSessionDto, RefreshResultDto } from './auth.types';
import type { LoginInput, RegisterInput } from './auth.validator';

const sessionUserSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarPath: true,
  updatedAt: true,
  defaultTimerMinutes: true,
  inviteCode: true,
} satisfies Prisma.UserSelect;

type SessionUser = Prisma.UserGetPayload<{ select: typeof sessionUserSelect }>;

// Computed once, lazily, so an unknown username costs the same as a wrong password.
let dummyHashPromise: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword('blink-timing-equalizer-password');
  return dummyHashPromise;
}

async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateInviteCode();
    const existing = await prisma.user.findUnique({ where: { inviteCode: code }, select: { id: true } });
    if (!existing) {
      return code;
    }
  }
  throw ApiError.internal('Could not allocate an invite code');
}

async function issueSession(user: SessionUser): Promise<AuthSessionDto> {
  const access = signAccessToken({ id: user.id, username: user.username });
  const refresh = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: hashToken(refresh.token),
      userId: user.id,
      expiresAt: refresh.expiresAt,
    },
  });

  return {
    user: toUserProfile(user, { includePrivate: true }),
    accessToken: access.token,
    refreshToken: refresh.token,
  };
}

export async function register(input: RegisterInput): Promise<AuthSessionDto> {
  const displayName = cleanSingleLine(input.displayName, MAX_DISPLAY_NAME_LENGTH);
  if (!displayName) {
    throw ApiError.badRequest('Display name cannot be empty', 'INVALID_DISPLAY_NAME');
  }

  const passwordHash = await hashPassword(input.password);
  const inviteCode = await generateUniqueInviteCode();

  let user: SessionUser;
  try {
    user = await prisma.user.create({
      data: {
        username: input.username,
        displayName,
        passwordHash,
        inviteCode,
      },
      select: sessionUserSelect,
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      throw ApiError.conflict('That username is already taken', 'USERNAME_TAKEN');
    }
    throw error;
  }

  return issueSession(user);
}

export async function login(input: LoginInput): Promise<AuthSessionDto> {
  const user = await prisma.user.findUnique({
    where: { username: input.username },
    select: { ...sessionUserSelect, passwordHash: true },
  });

  if (!user) {
    await verifyPassword(input.password, await getDummyHash());
    throw ApiError.unauthorized('Invalid username or password', 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid username or password', 'INVALID_CREDENTIALS');
  }

  const { passwordHash: _passwordHash, ...sessionUser } = user;
  return issueSession(sessionUser);
}

export async function refresh(refreshToken: string): Promise<RefreshResultDto & { user: SessionUser }> {
  const payload = verifyRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { token: hashToken(refreshToken) } });

  if (!stored || stored.userId !== payload.sub || stored.expiresAt.getTime() <= Date.now()) {
    throw ApiError.unauthorized('Refresh token is no longer valid', 'INVALID_REFRESH_TOKEN');
  }

  // Rotation is atomic: a concurrent second use of the same token deletes 0 rows.
  const deleted = await prisma.refreshToken.deleteMany({ where: { id: stored.id } });
  if (deleted.count !== 1) {
    throw ApiError.unauthorized('Refresh token has already been used', 'INVALID_REFRESH_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: sessionUserSelect });
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'ACCOUNT_NOT_FOUND');
  }

  const session = await issueSession(user);
  return {
    user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
}

/** Idempotent: deleting an unknown or already-used token still succeeds. */
export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token: hashToken(refreshToken) } });
}

export async function getSessionUser(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'ACCOUNT_NOT_FOUND');
  }
  return user;
}
