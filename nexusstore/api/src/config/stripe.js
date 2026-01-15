import Stripe from 'stripe';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Commission rate (default 15%)
const COMMISSION_RATE = parseFloat(process.env.STRIPE_COMMISSION) || 0.15;

// Create checkout session for app purchase
export async function createCheckoutSession(app, user, returnUrl) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: app.name,
            description: app.short_description || `Application ${app.type.toUpperCase()}`,
            images: app.icon ? [`${process.env.API_URL}/uploads/apps/${app.id}/icon.png`] : []
          },
          unit_amount: Math.round(app.price * 100) // Stripe uses cents
        },
        quantity: 1
      }
    ],
    metadata: {
      app_id: app.id,
      user_id: user.id,
      app_name: app.name
    },
    success_url: `${returnUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}/cancel`
  });

  return session;
}

// Process successful payment
export async function processPayment(session) {
  const appId = session.metadata.app_id;
  const userId = session.metadata.user_id;
  const amount = session.amount_total / 100; // Convert from cents
  const commission = amount * COMMISSION_RATE;

  return {
    appId,
    userId,
    amount,
    commission,
    netAmount: amount - commission,
    stripeSessionId: session.id,
    stripePaymentId: session.payment_intent
  };
}

// Verify webhook signature
export function verifyWebhookSignature(payload, signature) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

// Get payment details
export async function getPaymentIntent(paymentIntentId) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

// Create refund
export async function createRefund(paymentIntentId, amount = null) {
  const refundData = {
    payment_intent: paymentIntentId
  };

  if (amount) {
    refundData.amount = Math.round(amount * 100);
  }

  return stripe.refunds.create(refundData);
}

// Get commission rate
export function getCommissionRate() {
  return COMMISSION_RATE;
}

export default stripe;
