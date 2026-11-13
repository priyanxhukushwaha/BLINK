import fs from 'node:fs';
import type { RequestHandler } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { getUser } from '../../middleware/authenticate';
import * as uploadService from './upload.service';

export const getPreview: RequestHandler = asyncHandler(async (req, res, next) => {
  const user = getUser(req);
  const upload = await uploadService.getPendingUpload(req.params.uploadId ?? '', user.id);

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.type(upload.mimeType);

  const stream = fs.createReadStream(upload.absolutePath);
  stream.on('error', next);
  stream.pipe(res);
});
