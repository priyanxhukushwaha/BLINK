import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/database';
import { authHeader, describeIfDatabase, registerUser, resetDatabase } from '../helpers';

const app = createApp();

describeIfDatabase('auth (integration)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers, authenticates, rotates refresh tokens and logs out', async () => {
    const registered = await registerUser(app, '@pkdev', 'Priyanx Kushwaha');
    expect(registered.user.username).toBe('@pkdev');

    const me = await request(app)
      .get('/api/auth/me')
      .set(authHeader(registered.accessToken))
      .expect(200);
    expect(me.body.data.id).toBe(registered.user.id);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pkdev', password: 'BlinkPass123!' })
      .expect(200);

    const oldRefresh = login.body.data.refreshToken as string;
    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .expect(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();

    // Rotation: the presented token is single-use.
    await request(app).post('/api/auth/refresh').send({ refreshToken: oldRefresh }).expect(401);

    const newRefresh = refreshed.body.data.refreshToken as string;
    await request(app).post('/api/auth/logout').send({ refreshToken: newRefresh }).expect(200);
    await request(app).post('/api/auth/refresh').send({ refreshToken: newRefresh }).expect(401);
  });

  it('rejects duplicate usernames and bad credentials', async () => {
    await registerUser(app, 'aryan', 'Aryan');

    await request(app)
      .post('/api/auth/register')
      .send({ username: 'aryan', displayName: 'Someone else', password: 'BlinkPass123!' })
      .expect(409);

    await request(app)
      .post('/api/auth/login')
      .send({ username: 'aryan', password: 'WrongPass123!' })
      .expect(401);
  });

  it('protects authenticated routes', async () => {
    await request(app).get('/api/users/me').expect(401);
    await request(app).get('/api/rooms').set(authHeader('not-a-token')).expect(401);
  });
});
