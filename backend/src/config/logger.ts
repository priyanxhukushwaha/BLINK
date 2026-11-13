import winston from 'winston';
import { config } from './index';

const developmentFormat = winston.format.printf((info) => {
  const { level, message, timestamp, ...meta } = info as {
    level: string;
    message: unknown;
    timestamp?: string;
    [key: string]: unknown;
  };
  const extras = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp ?? ''} [${level}] ${String(message)}${extras}`;
});

/**
 * Structured logger.
 *
 * PRIVACY RULE: never pass message text, photo contents, passwords or tokens to
 * this logger. Log identifiers and event names only.
 */
export const logger = winston.createLogger({
  level: config.logLevel,
  format: config.isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json())
    : winston.format.combine(winston.format.timestamp(), developmentFormat),
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

export function logError(error: unknown, context?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error(message, { ...context, stack });
}
