import type { Express } from 'express';
import request from 'supertest';
import { prisma } from '../src/config/database';

/**
 * Integration tests need a real PostgreSQL database. They are opt-in so a unit
 * test run never touches a database:
 *
 *   RUN_INTEGRATION_TESTS=true DATABASE_URL=... npm run test:integration
 */
export const describeIfDatabase =
  process.env.RUN_INTEGRATION_TESTS === 'true' ? describe : describe.skip;

export interface TestSession {
  accessToken: string;
  refreshToken: string;
  user: { id: string; username: string; displayName: string };
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function resetDatabase(): Promise<void> {
  await prisma.messageRead.deleteMany();
  await prisma.message.deleteMany();
  await prisma.mediaUpload.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

export async function registerUser(
  app: Express,
  username: string,
  displayName = username,
  password = 'BlinkPass123!',
): Promise<TestSession> {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ username, displayName, password })
    .expect(201);

  return response.body.data as TestSession;
}

export async function makeFriends(
  app: Express,
  sender: TestSession,
  receiver: TestSession,
): Promise<void> {
  const created = await request(app)
    .post('/api/friends/request')
    .set(authHeader(sender.accessToken))
    .send({ userId: receiver.user.id })
    .expect(201);

  await request(app)
    .post(`/api/friends/accept/${created.body.data.id as string}`)
    .set(authHeader(receiver.accessToken))
    .expect(200);
}
