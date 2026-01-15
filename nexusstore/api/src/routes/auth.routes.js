import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

// Public routes
router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/me', authenticate, authController.updateProfile);
router.put('/me/password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;
