import { buildInviteLink, isSafeHttpsUrl, parseUploadUrl } from '../../src/utils/links';

const UPLOAD_ID = '123e4567-e89b-42d3-a456-426614174000';

describe('link helpers', () => {
  it('builds invite links from the public app URL', () => {
    expect(buildInviteLink('abc123')).toBe('http://localhost:5173/invite/abc123');
  });

  it('accepts only upload identifiers, never client-supplied file paths', () => {
    expect(parseUploadUrl(`/api/uploads/${UPLOAD_ID}`)).toBe(UPLOAD_ID);
    expect(parseUploadUrl(`https://api.blink.app/api/uploads/${UPLOAD_ID}`)).toBe(UPLOAD_ID);
    expect(parseUploadUrl('/api/uploads/../../etc/passwd')).toBeNull();
    expect(parseUploadUrl('/api/uploads/not-a-uuid')).toBeNull();
    expect(parseUploadUrl('https://evil.example.com/api/uploads/' + UPLOAD_ID)).toBe(UPLOAD_ID);
  });

  it('accepts only https avatar URLs', () => {
    expect(isSafeHttpsUrl('https://cdn.example.com/a.png')).toBe(true);
    expect(isSafeHttpsUrl('http://cdn.example.com/a.png')).toBe(false);
    expect(isSafeHttpsUrl('javascript:alert(1)')).toBe(false);
  });
});
