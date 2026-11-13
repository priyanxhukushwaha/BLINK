import sanitizeHtml from 'sanitize-html';

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Removes all markup and control characters from user input. */
export function stripMarkup(input: string): string {
  const withoutTags = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
  return withoutTags.replace(CONTROL_CHARS, '');
}

export function cleanSingleLine(input: string, maxLength: number): string {
  return stripMarkup(input).replace(/\s+/g, ' ').trim().slice(0, maxLength).trim();
}

export function cleanMultiline(input: string, maxLength: number): string {
  return stripMarkup(input)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength)
    .trim();
}
