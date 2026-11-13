import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/database';
import { authHeader, describeIfDatabase, registerUser, resetDatabase, type TestSession } from '../helpers';

const app = createApp();

async function befriend(a: TestSession, b: TestSession): Promise<void> {
  await prisma.friendship.createMany({
    data: [
      { userId: a.user.id, friendId: b.user.id },
      { userId: b.user.id, friendId: a.user.id },
    ],
  });
}

describeIfDatabase('rooms (integration)', () => {
  let a: TestSession;
  let b: TestSession;
  let c: TestSession;

  beforeEach(async () => {
    await resetDatabase();
    a = await registerUser(app, 'aryan', 'Aryan');
    b = await registerUser(app, 'maya', 'Maya');
    c = await registerUser(app, 'zoe', 'Zoe');
    await befriend(a, b);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('reuses one private room per pair and requires friendship', async () => {
    const first = await request(app)
      .post('/api/rooms/private')
      .set(authHeader(a.accessToken))
      .send({ recipientId: b.user.id })
      .expect(201);
    const second = await request(app)
      .post('/api/rooms/private')
      .set(authHeader(b.accessToken))
      .send({ recipientId: a.user.id })
      .expect(201);

    expect(second.body.data.id).toBe(first.body.data.id);
    expect(second.body.data.recipientId).toBe(a.user.id);

    await request(app)
      .post('/api/rooms/private')
      .set(authHeader(a.accessToken))
      .send({ recipientId: c.user.id })
      .expect(403);
  });

  it('enforces group admin rules, membership limits and timer updates', async () => {
    const created = await request(app)
      .post('/api/rooms/group')
      .set(authHeader(a.accessToken))
      .send({ name: 'Late Night Crew', memberIds: [b.user.id, c.user.id], timerMinutes: 5 })
      .expect(201);

    const room = created.body.data.room;
    const roomId = room.id as string;
    expect(room.memberCount).toBe(3);
    expect(room.adminId).toBe(a.user.id);

    // Any member may change the room default timer.
    const updated = await request(app)
      .patch(`/api/rooms/${roomId}/timer`)
      .set(authHeader(b.accessToken))
      .send({ timerMinutes: 30 })
      .expect(200);
    expect(updated.body.data.timerMinutes).toBe(30);

    await request(app)
      .patch(`/api/rooms/${roomId}/timer`)
      .set(authHeader(b.accessToken))
      .send({ timerMinutes: 7 })
      .expect(422);

    await request(app)
      .post(`/api/rooms/${roomId}/members`)
      .set(authHeader(b.accessToken))
      .send({ memberIds: [c.user.id] })
      .expect(403);

    await request(app)
      .delete(`/api/rooms/${roomId}/members/${b.user.id}`)
      .set(authHeader(b.accessToken))
      .expect(403);

    await request(app)
      .delete(`/api/rooms/${roomId}/members/${b.user.id}`)
      .set(authHeader(a.accessToken))
      .expect(200);

    const afterRemoval = await request(app)
      .get('/api/rooms')
      .set(authHeader(b.accessToken))
      .expect(200);
    expect(afterRemoval.body.data).toHaveLength(0);

    const leave = await request(app)
      .delete(`/api/rooms/${roomId}/leave`)
      .set(authHeader(c.accessToken))
      .expect(200);
    expect(leave.body.data.left).toBe(true);

    const remaining = await request(app)
      .get(`/api/rooms/${roomId}`)
      .set(authHeader(a.accessToken))
      .expect(200);
    expect(remaining.body.data.members).toHaveLength(1);
  });
});
