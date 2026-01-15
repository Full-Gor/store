import { Router } from 'express';
import authRoutes from './auth.routes.js';
import appsRoutes from './apps.routes.js';
import uploadRoutes from './upload.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'NexusStore API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      apps: '/api/apps',
      upload: '/api/upload',
      payment: '/api/checkout'
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/apps', appsRoutes);
router.use('/upload', uploadRoutes);
router.use('/checkout', paymentRoutes);

export default router;
