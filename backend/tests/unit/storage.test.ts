import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { config } from '../../src/config';
import {
  ensureUploadDirs,
  processImage,
  safeUnlink,
  type StoredImage,
} from '../../src/services/storage.service';

describe('image processing', () => {
  const created: string[] = [];

  async function makeSource(name: string, width: number, height: number): Promise<string> {
    const input = path.join(config.uploadDirs.tmp, name);
    await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 20, g: 40, b: 90 },
      },
    })
      .png()
      .toFile(input);
    return input;
  }

  function remember(stored: StoredImage, kind: 'photos' | 'avatars'): string {
    const output = path.join(config.uploadDirs[kind], stored.filePath);
    created.push(output);
    return output;
  }

  beforeAll(async () => {
    await ensureUploadDirs();
  });

  afterAll(async () => {
    await Promise.all(created.map((file) => safeUnlink(file)));
    await fs.rm(config.uploadDirs.root, { recursive: true, force: true });
  });

  it('re-encodes a photo, bounds its dimensions and removes the temp file', async () => {
    const input = await makeSource('photo-source.png', 2400, 1200);

    const stored = await processImage(input, 'photos');
    const output = remember(stored, 'photos');
    const metadata = await sharp(output).metadata();

    expect(stored.mimeType).toBe('image/png');
    expect(stored.sizeBytes).toBeGreaterThan(0);
    expect(metadata.width).toBeLessThanOrEqual(1600);
    expect(metadata.height).toBeLessThanOrEqual(1600);
    expect(await fs.stat(input).catch(() => null)).toBeNull();
  });

  it('square-crops avatars and bounds them to 512px', async () => {
    const input = await makeSource('avatar-source.png', 1000, 600);

    const stored = await processImage(input, 'avatars');
    const output = remember(stored, 'avatars');
    const metadata = await sharp(output).metadata();

    expect(metadata.width).toBe(512);
    expect(metadata.height).toBe(512);
  });

  it('rejects non-image uploads and still cleans up the temp file', async () => {
    const input = path.join(config.uploadDirs.tmp, 'not-an-image.jpg');
    await fs.writeFile(input, 'definitely not an image');

    await expect(processImage(input, 'photos')).rejects.toMatchObject({ statusCode: 415 });
    expect(await fs.stat(input).catch(() => null)).toBeNull();
  });
});
