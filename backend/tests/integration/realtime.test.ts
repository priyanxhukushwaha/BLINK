import http from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { io as createClient, type Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/database';
import { createSocketServer } from '../../src/config/socket';
import type { ClientToServerEvents, ServerToClientEvents, SocketUser } from '../../src/types/socket';
import type { MessageDto } from '../../src/modules/messages/message.types';
import type { AckResponse } from '../../src/types/common';
import { detachRealtime } from '../../src/websocket/realtime';
import { authHeader, describeIfDatabase, makeFriends, registerUser, resetDatabase } from '../helpers';

const app = createApp();

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

function waitForEvent<K extends keyof ServerToClientEvents>(
  socket: TestClient,
  event: K,
  timeoutMs = 5000,
): Promise<Parameters<ServerToClientEvents[K]>[0]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${String(event)}`)), timeoutMs);
    const listener = (payload: Parameters<ServerToClientEvents[K]>[0]) => {
      clearTimeout(timer);
      resolve(payload);
    };
    // Socket.IO's typed `once` cannot distribute over a generic event key.
    const once = (socket.once as unknown as (name: K, handler: typeof listener) => void).bind(socket);
    once(event, listener);
  });
}

function emitWithAck<K extends keyof ClientToServerEvents>(
  socket: TestClient,
  event: K,
  payload: Parameters<ClientToServerEvents[K]>[0],
): Promise<AckResponse<unknown>> {
  return new Promise((resolve) => {
    const emit = (
      socket.emit as unknown as (
        name: string,
        body: unknown,
        ack: (response: AckResponse<unknown>) => void,
      ) => void
    ).bind(socket);
    emit(event, payload, resolve);
  });
}

describeIfDatabase('realtime (integration)', () => {
  let httpServer: http.Server;
  let socketServer: ReturnType<typeof createSocketServer>;
  let baseUrl: string;
  const clients: TestClient[] = [];

  beforeAll(async () => {
    httpServer = http.createServer(app);
    socketServer = createSocketServer(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const address = httpServer.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(() => {
    for (const client of clients.splice(0)) {
      client.disconnect();
    }
  });

  afterAll(async () => {
    detachRealtime();
    await new Promise<void>((resolve) => {
      socketServer.close(() => resolve());
    });
    if (httpServer.listening) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
    await prisma.$disconnect();
  });

  function connect(token: string): TestClient {
    const client: TestClient = createClient(baseUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });
    clients.push(client);
    return client;
  }

  it('authenticates, delivers messages, read receipts and typing to the room', async () => {
    await resetDatabase();

    const a = await registerUser(app, 'aryan', 'Aryan');
    const b = await registerUser(app, 'maya', 'Maya');
    await makeFriends(app, a, b);

    const roomResponse = await request(app)
      .post('/api/rooms/private')
      .set(authHeader(a.accessToken))
      .send({ recipientId: b.user.id })
      .expect(201);
    const roomId = roomResponse.body.data.id as string;

    const clientA = connect(a.accessToken);
    const clientB = connect(b.accessToken);

    const authenticatedA = waitForEvent(clientA, 'ws:authenticated');
    const authenticatedB = waitForEvent(clientB, 'ws:authenticated');

    const [authA, authB] = await Promise.all([authenticatedA, authenticatedB]);
    expect((authA.user as SocketUser).id).toBe(a.user.id);
    expect((authB.user as SocketUser).id).toBe(b.user.id);

    const incoming = waitForEvent(clientB, 'ws:new_message');
    const sendAck = await emitWithAck(clientA, 'ws:send_message', {
      roomId,
      text: 'socket hello',
    });
    expect(sendAck.ok).toBe(true);
    const delivered = (await incoming) as MessageDto;
    expect(delivered.text).toBe('socket hello');
    expect(delivered.senderId).toBe(a.user.id);
    expect(delivered.firstReadAt).toBeNull();

    const receiptOnA = waitForEvent(clientA, 'ws:message_read');
    const readAck = await emitWithAck(clientB, 'ws:mark_read', { roomId });
    expect(readAck.ok).toBe(true);
    const receipt = await receiptOnA;
    expect(receipt.messageId).toBe(delivered.id);
    expect(receipt.firstReadBy).toBe(b.user.id);

    const typingOnA = waitForEvent(clientA, 'ws:typing');
    clientB.emit('ws:typing', { roomId });
    const typing = await typingOnA;
    expect(typing.userId).toBe(b.user.id);
    expect(typing.roomId).toBe(roomId);
  });

  it('rejects socket actions before authentication', async () => {
    const anonymous = createClient(baseUrl, { transports: ['websocket'], reconnection: false });
    await new Promise<void>((resolve, reject) => {
      anonymous.once('connect', resolve);
      anonymous.once('connect_error', reject);
    });

    const denied = await new Promise<AckResponse<unknown>>((resolve) => {
      anonymous.emit(
        'ws:send_message',
        { roomId: '00000000-0000-4000-8000-000000000000', text: 'nope' },
        resolve,
      );
    });

    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.error.code).toBe('NOT_AUTHENTICATED');
    }

    anonymous.disconnect();
  });
});
