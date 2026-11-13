import { MAX_MESSAGE_LIFETIME_MS } from '../../src/utils/constants';
import { computeExpiresAt, isExpired, remainingMs } from '../../src/utils/expiration';

describe('computeExpiresAt', () => {
  const sentAt = new Date('2026-01-01T00:00:00.000Z');

  it('expires unread messages at the absolute 60 minute ceiling', () => {
    const expiresAt = computeExpiresAt(sentAt, null, 5 * 60_000);
    expect(expiresAt.getTime() - sentAt.getTime()).toBe(MAX_MESSAGE_LIFETIME_MS);
  });

  it('starts the timer when the first recipient reads', () => {
    const firstReadAt = new Date(sentAt.getTime() + 60_000);
    const expiresAt = computeExpiresAt(sentAt, firstReadAt, 5 * 60_000);
    expect(expiresAt.getTime() - firstReadAt.getTime()).toBe(5 * 60_000);
  });

  it('never extends a message past the ceiling, even with a 60 minute timer', () => {
    const firstReadAt = new Date(sentAt.getTime() + 30 * 60_000);
    const expiresAt = computeExpiresAt(sentAt, firstReadAt, 60 * 60_000);
    expect(expiresAt.getTime()).toBe(sentAt.getTime() + MAX_MESSAGE_LIFETIME_MS);
  });

  it('caps the timer when it would run past the ceiling', () => {
    const firstReadAt = new Date(sentAt.getTime() + 59 * 60_000);
    const expiresAt = computeExpiresAt(sentAt, firstReadAt, 15 * 60_000);
    expect(expiresAt.getTime()).toBe(sentAt.getTime() + MAX_MESSAGE_LIFETIME_MS);
  });

  it('treats the exact expiry instant as expired and never goes negative', () => {
    const expiresAt = computeExpiresAt(sentAt, null, 1);
    expect(isExpired(expiresAt, expiresAt)).toBe(true);
    expect(remainingMs(expiresAt, new Date(expiresAt.getTime() + 5_000))).toBe(0);
    expect(isExpired(expiresAt, new Date(expiresAt.getTime() - 1))).toBe(false);
  });
});
