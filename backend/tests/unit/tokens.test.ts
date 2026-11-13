import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/tokens';

describe('tokens', () => {
  it('signs and verifies access tokens', () => {
    const { token, expiresAt } = signAccessToken({ id: 'user-1', username: 'pkdev' });
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.username).toBe('pkdev');
    expect(payload.type).toBe('access');
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects an access token where a refresh token is required', () => {
    const { token } = signAccessToken({ id: 'user-1', username: 'pkdev' });
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it('signs refresh tokens with a unique jti', () => {
    const first = signRefreshToken('user-1');
    const second = signRefreshToken('user-1');

    expect(verifyRefreshToken(first.token).jti).toBe(first.jti);
    expect(first.jti).not.toBe(second.jti);
  });

  it('rejects tampered tokens and hashes refresh tokens deterministically', () => {
    const { token } = signAccessToken({ id: 'user-1', username: 'pkdev' });

    expect(() => verifyAccessToken(`${token}x`)).toThrow();
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
  });
});
