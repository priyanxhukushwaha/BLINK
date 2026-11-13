import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from '../websocket/socket.handler';
import { attachRealtime, type BlinkServer } from '../websocket/realtime';
import { config } from './index';
import { logger } from './logger';

export function createSocketServer(httpServer: HttpServer): BlinkServer {
  const io: BlinkServer = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: [...config.corsOrigins],
      methods: ['GET', 'POST'],
      credentials: false,
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1_000_000,
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  attachRealtime(io);

  io.on('connection', (socket) => {
    logger.debug('socket_connected', { socketId: socket.id });
    registerSocketHandlers(io, socket);
  });

  return io;
}
