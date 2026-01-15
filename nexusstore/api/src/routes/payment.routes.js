import { Router } from 'express';
import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Create checkout session (requires auth)
router.post('/', authenticate, paymentController.createCheckout);

// Stripe webhook (raw body required)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

// Get purchase history
router.get('/purchases', authenticate, paymentController.getPurchases);

// Check if user owns app
router.get('/owns/:appId', authenticate, paymentController.checkOwnership);

export default router;
