import http from 'node:http';
import { createApp } from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';
import { connectRedis, disconnectRedis } from './config/redis';
import { createSocketServer } from './config/socket';
import { startJobs, stopJobs } from './jobs';
import { detachRealtime } from './websocket/realtime';

async function bootstrap(): Promise<void> {
  const app = createApp();

  await connectDatabase();
  await connectRedis();

  const httpServer = http.createServer(app);
  const io = createSocketServer(httpServer);
  await startJobs();

  httpServer.listen(config.port, () => {
    logger.info('BLINK backend listening', {
      port: config.port,
      env: config.env,
      corsOrigins: config.corsOrigins,
    });
  });

  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('Shutting down', { signal });

    stopJobs();
    detachRealtime();
    io.close();

    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
      // Do not hang forever on keep-alive connections.
      setTimeout(resolve, 5000).unref();
    });

    await disconnectRedis();
    await disconnectDatabase();
    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.name : typeof reason,
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { name: error.name });
    void shutdown('uncaughtException');
  });
}

bootstrap().catch((error: unknown) => {
  const name = error instanceof Error ? error.name : 'UnknownError';
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Failed to start BLINK backend', { name, message: config.isProduction ? undefined : message });
  process.exit(1);
});
