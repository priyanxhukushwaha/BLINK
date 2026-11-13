import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const MAX_LIFETIME_MS = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

const PASSWORD = 'BlinkDev123!';

function expiresAt(sentAt: Date, firstReadAt: Date | null, timerDurationMs: number): Date {
  const ceiling = sentAt.getTime() + MAX_LIFETIME_MS;
  return new Date(
    firstReadAt ? Math.min(ceiling, firstReadAt.getTime() + timerDurationMs) : ceiling,
  );
}

const users = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    username: 'pkdev',
    displayName: 'Priyanx Kushwaha',
    bio: 'Just a moment here. ✨',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    username: 'aryan',
    displayName: 'Aryan',
    bio: 'Night owl. Leave no trace.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    username: 'maya',
    displayName: 'Maya',
    bio: 'Here for a good time, not a long time.',
  },
];

const privateRoomId = 'b0000000-0000-4000-8000-000000000001';
const groupRoomId = 'b0000000-0000-4000-8000-000000000002';

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        displayName: user.displayName,
        bio: user.bio,
      },
      create: {
        ...user,
        passwordHash,
        defaultTimerMinutes: 15,
        inviteCode: `seed-${user.username}`,
      },
    });
  }

  const [pkdev, aryan, maya] = users;
  const dmKey = [pkdev.id, aryan.id].sort().join(':');

  await prisma.room.upsert({
    where: { id: privateRoomId },
    update: { timerMinutes: 5 },
    create: {
      id: privateRoomId,
      name: aryan.displayName,
      type: 'PRIVATE',
      dmKey,
      timerMinutes: 5,
    },
  });

  await prisma.room.upsert({
    where: { id: groupRoomId },
    update: { name: 'Late Night Crew 🌙', timerMinutes: 15 },
    create: {
      id: groupRoomId,
      name: 'Late Night Crew 🌙',
      type: 'GROUP',
      adminId: pkdev.id,
      timerMinutes: 15,
    },
  });

  await prisma.roomMember.createMany({
    data: [
      { roomId: privateRoomId, userId: pkdev.id, role: 'MEMBER' },
      { roomId: privateRoomId, userId: aryan.id, role: 'MEMBER' },
      { roomId: groupRoomId, userId: pkdev.id, role: 'ADMIN' },
      { roomId: groupRoomId, userId: aryan.id, role: 'MEMBER' },
      { roomId: groupRoomId, userId: maya.id, role: 'MEMBER' },
    ],
    skipDuplicates: true,
  });

  for (const [userId, friendId] of [
    [pkdev.id, aryan.id],
    [aryan.id, pkdev.id],
    [pkdev.id, maya.id],
    [maya.id, pkdev.id],
    [aryan.id, maya.id],
    [maya.id, aryan.id],
  ]) {
    await prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId } },
      update: {},
      create: { userId, friendId },
    });
  }

  const now = Date.now();
  const groupMessages = [
    {
      id: 'c0000000-0000-4000-8000-000000000001',
      senderId: aryan.id,
      text: 'anyone up? 👀',
      sentAt: new Date(now - 3 * MINUTE),
      firstReadAt: new Date(now - 2 * MINUTE),
      firstReadBy: pkdev.id,
      timerDurationMs: 15 * MINUTE,
    },
    {
      id: 'c0000000-0000-4000-8000-000000000002',
      senderId: maya.id,
      text: 'always 🌙',
      sentAt: new Date(now - 2 * MINUTE),
      firstReadAt: null,
      firstReadBy: null,
      timerDurationMs: 15 * MINUTE,
    },
    {
      id: 'c0000000-0000-4000-8000-000000000003',
      senderId: pkdev.id,
      text: 'be present. leave no history.',
      sentAt: new Date(now - 1 * MINUTE),
      firstReadAt: null,
      firstReadBy: null,
      timerDurationMs: 15 * MINUTE,
    },
  ];

  for (const message of groupMessages) {
    await prisma.message.upsert({
      where: { id: message.id },
      update: {
        sentAt: message.sentAt,
        firstReadAt: message.firstReadAt,
        firstReadBy: message.firstReadBy,
        expiresAt: expiresAt(message.sentAt, message.firstReadAt, message.timerDurationMs),
      },
      create: {
        ...message,
        roomId: groupRoomId,
        expiresAt: expiresAt(message.sentAt, message.firstReadAt, message.timerDurationMs),
      },
    });
  }

  const privateMessageId = 'c0000000-0000-4000-8000-000000000004';
  const privateSentAt = new Date(now - 4 * MINUTE);
  const privateFirstReadAt = new Date(now - 1 * MINUTE);

  await prisma.message.upsert({
    where: { id: privateMessageId },
    update: {
      sentAt: privateSentAt,
      firstReadAt: privateFirstReadAt,
      firstReadBy: aryan.id,
      expiresAt: expiresAt(privateSentAt, privateFirstReadAt, 5 * MINUTE),
    },
    create: {
      id: privateMessageId,
      roomId: privateRoomId,
      senderId: pkdev.id,
      text: 'this one disappears in a few minutes',
      sentAt: privateSentAt,
      firstReadAt: privateFirstReadAt,
      firstReadBy: aryan.id,
      timerDurationMs: 5 * MINUTE,
      expiresAt: expiresAt(privateSentAt, privateFirstReadAt, 5 * MINUTE),
    },
  });

  await prisma.messageRead.createMany({
    data: [
      { messageId: privateMessageId, userId: aryan.id },
      { messageId: 'c0000000-0000-4000-8000-000000000001', userId: pkdev.id },
    ],
    skipDuplicates: true,
  });

  console.log('Seed ready. Demo login: pkdev / aryan / maya — password:', PASSWORD);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
