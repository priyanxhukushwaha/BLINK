import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('password hashing', () => {
  it('never stores the plaintext and verifies correct passwords', async () => {
    const hash = await hashPassword('BlinkPass123!');

    expect(hash).not.toContain('BlinkPass123!');
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    await expect(verifyPassword('BlinkPass123!', hash)).resolves.toBe(true);
    await expect(verifyPassword('BlinkPass123', hash)).resolves.toBe(false);
  });

  it('produces a different hash for the same password (unique salts)', async () => {
    const [first, second] = await Promise.all([hashPassword('same-password'), hashPassword('same-password')]);
    expect(first).not.toBe(second);
  });
});
