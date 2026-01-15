import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadApp, uploadIcon, uploadScreenshots, handleUploadError } from '../middleware/upload.js';

const router = Router();

// All upload routes require authentication and developer role
router.use(authenticate);
router.use(requireRole('developer', 'admin'));

// Upload app file (APK/AAB/ZIP)
router.post(
  '/app/:appId',
  uploadApp.single('app'),
  handleUploadError,
  uploadController.uploadAppFile
);

// Upload app icon
router.post(
  '/icon/:appId',
  uploadIcon.single('icon'),
  handleUploadError,
  uploadController.uploadAppIcon
);

// Upload screenshots
router.post(
  '/screenshots/:appId',
  uploadScreenshots.array('screenshots', 8),
  handleUploadError,
  uploadController.uploadScreenshots
);

export default router;
