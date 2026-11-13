import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/database';
import { MAX_MESSAGE_LIFETIME_MS } from '../../src/utils/constants';
import { runExpirationSweepNow } from '../../src/jobs/expiration.job';
import {
  authHeader,
  describeIfDatabase,
  makeFriends,
  registerUser,
  resetDatabase,
  type TestSession,
} from '../helpers';

const app = createApp();

async function createPrivateRoom(a: TestSession, b: TestSession): Promise<string> {
  const response = await request(app)
    .post('/api/rooms/private')
    .set(authHeader(a.accessToken))
    .send({ recipientId: b.user.id })
    .expect(201);
  return response.body.data.id as string;
}

describeIfDatabase('messaging (integration)', () => {
  let a: TestSession;
  let b: TestSession;
  let outsider: TestSession;
  let roomId: string;

  beforeEach(async () => {
    await resetDatabase();
    a = await registerUser(app, 'aryan', 'Aryan');
    b = await registerUser(app, 'maya', 'Maya');
    outsider = await registerUser(app, 'zoe', 'Zoe');
    await makeFriends(app, a, b);
    roomId = await createPrivateRoom(a, b);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('starts unread messages at the 60 minute ceiling', async () => {
    const sent = await request(app)
      .post(`/api/rooms/${roomId}/messages`)
      .set(authHeader(a.accessToken))
      .send({ text: 'be present, leave no history' })
      .expect(201);

    const message = sent.body.data;
    expect(message.firstReadAt).toBeNull();
    expect(message.firstReadBy).toBeNull();
    expect(message.expiresAt - message.sentAt).toBe(MAX_MESSAGE_LIFETIME_MS);
    expect(message.readBy).toEqual([]);
  });

  it('locks firstReadAt on the first recipient read and shortens expiry', async () => {
    await request(app)
      .patch(`/api/rooms/${roomId}/timer`)
      .set(authHeader(a.accessToken))
      .send({ timerMinutes: 1 })
      .expect(200);

    await request(app)
      .post(`/api/rooms/${roomId}/messages`)
      .set(authHeader(a.accessToken))
      .send({ text: 'this one starts ticking' })
      .expect(201);

    const read = await request(app)
      .post(`/api/rooms/${roomId}/messages/read`)
      .set(authHeader(b.accessToken))
      .expect(200);
    expect(read.body.data.readCount).toBe(1);

    const listed = await request(app)
      .get(`/api/rooms/${roomId}/messages`)
      .set(authHeader(b.accessToken))
      .expect(200);

    const message = listed.body.data.messages[0];
    expect(message.firstReadBy).toBe(b.user.id);
    expect(message.expiresAt - message.firstReadAt).toBe(60_000);
    expect(message.readBy).toContain(b.user.id);

    // A second read must not move firstReadAt.
    const firstReadAt = message.firstReadAt;
    await request(app)
      .post(`/api/rooms/${roomId}/messages/read`)
      .set(authHeader(b.accessToken))
      .expect(200);
    const listedAgain = await request(app)
      .get(`/api/rooms/${roomId}/messages`)
      .set(authHeader(b.accessToken))
      .expect(200);
    expect(listedAgain.body.data.messages[0].firstReadAt).toBe(firstReadAt);
  });

  it('blocks non-members and protects message ownership', async () => {
    const sent = await request(app)
      .post(`/api/rooms/${roomId}/messages`)
      .set(authHeader(a.accessToken))
      .send({ text: 'private words' })
      .expect(201);
    const messageId = sent.body.data.id as string;

    await request(app)
      .get(`/api/rooms/${roomId}/messages`)
      .set(authHeader(outsider.accessToken))
      .expect(403);

    await request(app)
      .delete(`/api/rooms/${roomId}/messages/${messageId}`)
      .set(authHeader(b.accessToken))
      .expect(403);

    await request(app)
      .delete(`/api/rooms/${roomId}/messages/${messageId}`)
      .set(authHeader(a.accessToken))
      .expect(200);

    const listed = await request(app)
      .get(`/api/rooms/${roomId}/messages`)
      .set(authHeader(a.accessToken))
      .expect(200);
    expect(listed.body.data.messages).toHaveLength(0);
  });

  it('hard-deletes expired messages from the database', async () => {
    const expired = await prisma.message.create({
      data: {
        roomId,
        senderId: a.user.id,
        text: 'stale',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        timerDurationMs: 60_000,
        expiresAt: new Date(Date.now() - 1_000),
      },
    });

    await runExpirationSweepNow();

    expect(await prisma.message.findUnique({ where: { id: expired.id } })).toBeNull();
  });
});
