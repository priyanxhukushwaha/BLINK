import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as uploadController from './upload.controller';

const router = Router();

router.use(authenticate);
router.get('/:uploadId', uploadController.getPreview);

export const uploadRoutes = router;
