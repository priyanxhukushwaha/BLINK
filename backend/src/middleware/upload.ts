import crypto from 'node:crypto';
import fs from 'node:fs';
import multer from 'multer';
import { config } from '../config';
import { ApiError } from '../utils/ApiError';
import { ALLOWED_IMAGE_MIME_TYPES } from '../utils/constants';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function createPhotoUpload(): multer.Multer {
  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
      try {
        fs.mkdirSync(config.uploadDirs.tmp, { recursive: true });
        callback(null, config.uploadDirs.tmp);
      } catch (error) {
        callback(error as Error, config.uploadDirs.tmp);
      }
    },
    filename: (_req, file, callback) => {
      const extension = EXTENSION_BY_MIME[file.mimetype] ?? '.bin';
      callback(null, `${crypto.randomUUID()}${extension}`);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: config.maxFileSizeBytes,
      files: 1,
      fields: 10,
    },
    fileFilter: (_req, file, callback) => {
      if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
        callback(ApiError.unsupportedMedia('Only JPEG, PNG or WebP images are allowed'));
        return;
      }
      callback(null, true);
    },
  });
}

const photoUpload = createPhotoUpload();

/** Multer middleware for a single `photo` field. */
export const uploadSinglePhoto = photoUpload.single('photo');
