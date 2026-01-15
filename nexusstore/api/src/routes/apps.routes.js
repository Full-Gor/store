import { Router } from 'express';
import * as appsController from '../controllers/apps.controller.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

// Public routes
router.get('/', optionalAuth, appsController.getApps);
router.get('/featured', appsController.getFeaturedApps);
router.get('/categories', appsController.getCategories);
router.get('/:idOrSlug', optionalAuth, appsController.getApp);
router.get('/:id/download', optionalAuth, appsController.downloadApp);
router.get('/:id/reviews', appsController.getReviews);

// Protected routes (developer/admin)
router.post('/', authenticate, requireRole('developer', 'admin'), validate(schemas.createApp), appsController.createApp);
router.put('/:id', authenticate, appsController.updateApp);
router.delete('/:id', authenticate, appsController.deleteApp);

// Developer stats
router.get('/developer/stats', authenticate, requireRole('developer', 'admin'), appsController.getDeveloperStats);
router.get('/developer/apps', authenticate, requireRole('developer', 'admin'), appsController.getDeveloperApps);

// Reviews (authenticated users)
router.post('/:id/reviews', authenticate, validate(schemas.review), appsController.createReview);

export default router;
