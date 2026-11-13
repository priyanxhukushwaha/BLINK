import { PrismaClient } from '@prisma/client';
import { config } from './index';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as { __blinkPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.__blinkPrisma ??
  new PrismaClient({
    datasourceUrl: config.databaseUrl,
    log: config.isTest ? [] : ['warn', 'error'],
  });

// Reuse the client across hot reloads in development.
if (!config.isProduction) {
  globalForPrisma.__blinkPrisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
