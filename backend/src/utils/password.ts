import bcrypt from 'bcryptjs';
import { config } from '../config';

/**
 * bcryptjs is a pure-JavaScript implementation of bcrypt with the same hash
 * format and cost factor. It avoids native build requirements on Windows while
 * keeping the required 12 rounds.
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, config.bcryptRounds);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
