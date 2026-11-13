import { cleanMultiline, cleanSingleLine } from '../../src/utils/sanitize';

describe('text sanitization', () => {
  it('strips markup and collapses whitespace in single-line fields', () => {
    expect(cleanSingleLine('<b>Priyanx</b>   Kushwaha', 50)).toBe('Priyanx Kushwaha');
    expect(cleanSingleLine('  hello  ', 50)).toBe('hello');
  });

  it('removes control characters', () => {
    expect(cleanSingleLine('a\u0000b\u0007c', 50)).toBe('abc');
  });

  it('keeps meaningful line breaks but collapses runs of blank lines', () => {
    expect(cleanMultiline('line one\n\n\n\nline two', 100)).toBe('line one\n\nline two');
    expect(cleanMultiline('hello <script>alert(1)</script> world', 100)).not.toContain('<');
  });

  it('enforces the maximum length after cleaning', () => {
    expect(cleanSingleLine('a'.repeat(100), 10)).toHaveLength(10);
    expect(cleanMultiline('b'.repeat(100), 20)).toHaveLength(20);
  });
});
