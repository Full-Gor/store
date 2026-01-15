import { query } from '../config/database.js';
import { createCheckoutSession, verifyWebhookSignature, processPayment, getCommissionRate } from '../config/stripe.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

// POST /api/checkout
export async function createCheckout(req, res, next) {
  try {
    const { appId } = req.body;

    if (!appId) {
      throw new ValidationError('ID de l\'application requis');
    }

    // Get app details
    const appResult = await query('SELECT * FROM apps WHERE id = $1 AND status = $2', [appId, 'approved']);

    if (appResult.rows.length === 0) {
      throw new NotFoundError('Application non trouvée');
    }

    const app = appResult.rows[0];

    if (app.price <= 0) {
      throw new ValidationError('Cette application est gratuite');
    }

    // Check if already purchased
    const existingPurchase = await query(
      'SELECT id FROM purchases WHERE user_id = $1 AND app_id = $2 AND status = $3',
      [req.user.id, appId, 'completed']
    );

    if (existingPurchase.rows.length > 0) {
      throw new ValidationError('Vous avez déjà acheté cette application');
    }

    // Create Stripe checkout session
    const returnUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await createCheckoutSession(app, req.user, returnUrl);

    // Create pending purchase record
    await query(
      `INSERT INTO purchases (user_id, app_id, amount, commission, stripe_session_id, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [req.user.id, appId, app.price, app.price * getCommissionRate(), session.id]
    );

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/checkout/webhook
export async function handleWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Signature manquante' });
    }

    let event;
    try {
      event = verifyWebhookSignature(req.body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Signature invalide' });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const paymentData = await processPayment(session);

        // Update purchase record
        await query(
          `UPDATE purchases SET
             status = 'completed',
             stripe_payment_id = $1
           WHERE stripe_session_id = $2`,
          [paymentData.stripePaymentId, session.id]
        );

        console.log('Payment completed:', paymentData);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;

        // Mark purchase as failed
        await query(
          `UPDATE purchases SET status = 'failed'
           WHERE stripe_session_id = $1`,
          [session.id]
        );

        console.log('Payment session expired:', session.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log('Unhandled webhook event:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    next(error);
  }
}

// GET /api/checkout/purchases
export async function getPurchases(req, res, next) {
  try {
    const result = await query(`
      SELECT p.*, a.name as app_name, a.icon, a.slug
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json({ purchases: result.rows });
  } catch (error) {
    next(error);
  }
}

// GET /api/checkout/owns/:appId
export async function checkOwnership(req, res, next) {
  try {
    const { appId } = req.params;

    // Check if app is free
    const appResult = await query('SELECT price FROM apps WHERE id = $1', [appId]);

    if (appResult.rows.length === 0) {
      throw new NotFoundError('Application non trouvée');
    }

    const app = appResult.rows[0];

    // Free apps are always "owned"
    if (app.price <= 0) {
      return res.json({ owns: true, reason: 'free' });
    }

    // Check for purchase
    const purchaseResult = await query(
      'SELECT id FROM purchases WHERE user_id = $1 AND app_id = $2 AND status = $3',
      [req.user.id, appId, 'completed']
    );

    res.json({
      owns: purchaseResult.rows.length > 0,
      reason: purchaseResult.rows.length > 0 ? 'purchased' : 'not_purchased'
    });
  } catch (error) {
    next(error);
  }
}
