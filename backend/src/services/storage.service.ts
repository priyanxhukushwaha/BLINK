import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp, { type Sharp } from 'sharp';
import { config } from '../config';
import { ApiError } from '../utils/ApiError';
import { MAX_AVATAR_DIMENSION, MAX_PHOTO_DIMENSION } from '../utils/constants';

export type UploadKind = 'photos' | 'avatars';

export interface StoredImage {
  /** File name only — the database never stores a client-supplied path. */
  filePath: string;
  mimeType: string;
  sizeBytes: number;
}

interface FormatConfig {
  extension: string;
  mimeType: string;
  encode: (pipeline: Sharp) => Sharp;
}

const FORMATS: Record<string, FormatConfig> = {
  jpeg: {
    extension: 'jpg',
    mimeType: 'image/jpeg',
    encode: (pipeline) => pipeline.jpeg({ quality: 82, progressive: true }),
  },
  png: {
    extension: 'png',
    mimeType: 'image/png',
    encode: (pipeline) => pipeline.png({ compressionLevel: 9, palette: true }),
  },
  webp: {
    extension: 'webp',
    mimeType: 'image/webp',
    encode: (pipeline) => pipeline.webp({ quality: 82 }),
  },
};

export async function ensureUploadDirs(): Promise<void> {
  await Promise.all([
    fs.mkdir(config.uploadDirs.root, { recursive: true }),
    fs.mkdir(config.uploadDirs.photos, { recursive: true }),
    fs.mkdir(config.uploadDirs.avatars, { recursive: true }),
    fs.mkdir(config.uploadDirs.tmp, { recursive: true }),
  ]);
}

export async function safeUnlink(absolutePath: string): Promise<void> {
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

export function resolveStoredFile(kind: UploadKind, fileName: string): string {
  const base = config.uploadDirs[kind];
  const resolved = path.resolve(base, path.basename(fileName));
  if (!resolved.startsWith(base + path.sep)) {
    throw ApiError.badRequest('Invalid file reference');
  }
  return resolved;
}

/**
 * Re-encodes the uploaded image, which strips EXIF/metadata, enforces an
 * allowed format, bounds the dimensions and validates that the bytes really
 * are an image. The temporary upload is always removed.
 */
export async function processImage(inputPath: string, kind: UploadKind): Promise<StoredImage> {
  try {
    const pipeline = sharp(inputPath, { failOn: 'error', limitInputPixels: 50_000_000 }).rotate();
    const metadata = await pipeline.metadata();
    const format = metadata.format;

    if (!format || !(format in FORMATS)) {
      throw ApiError.unsupportedMedia('Only JPEG, PNG or WebP images are allowed');
    }

    const target = FORMATS[format];
    const maxDimension = kind === 'avatars' ? MAX_AVATAR_DIMENSION : MAX_PHOTO_DIMENSION;
    const filePath = `${crypto.randomUUID()}.${target.extension}`;
    const destination = path.join(config.uploadDirs[kind], filePath);

    const resized =
      kind === 'avatars'
        ? pipeline.resize(maxDimension, maxDimension, { fit: 'cover', position: 'attention' })
        : pipeline.resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true });

    await target.encode(resized).toFile(destination);

    const stat = await fs.stat(destination);
    if (stat.size > config.maxFileSizeBytes) {
      await safeUnlink(destination);
      throw ApiError.payloadTooLarge(`Image must be ${Math.floor(config.maxFileSizeBytes / (1024 * 1024))} MB or smaller`);
    }

    return { filePath, mimeType: target.mimeType, sizeBytes: stat.size };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unsupportedMedia('The uploaded file is not a valid image');
  } finally {
    await safeUnlink(inputPath).catch(() => undefined);
  }
}

/** Deletes the photo file belonging to a message, if it has one. */
export async function deleteStoredPhoto(filePath: string | null): Promise<void> {
  if (!filePath) return;
  await safeUnlink(resolveStoredFile('photos', filePath)).catch(() => undefined);
}

export async function deleteStoredAvatar(filePath: string | null): Promise<void> {
  if (!filePath) return;
  await safeUnlink(resolveStoredFile('avatars', filePath)).catch(() => undefined);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Deterministic initials avatar. Generating it locally means the API never
 * makes the client load a third-party image (which would leak IP metadata).
 */
export function createInitialsAvatar(displayName: string, seed: string): string {
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?';

  const digest = crypto.createHash('sha256').update(seed).digest();
  const hue = (digest[0] ?? 0) % 360;
  const hue2 = (hue + 40) % 360;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="${escapeXml(initials)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 78%, 42%)"/>
      <stop offset="100%" stop-color="hsl(${hue2}, 72%, 26%)"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="128" fill="url(#g)"/>
  <text x="128" y="128" dy="0.36em" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="96" font-weight="700" fill="#ffffff">${escapeXml(initials)}</text>
</svg>`;
}
