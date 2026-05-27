import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay only if credentials are provided
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✓ Razorpay initialized');
} else {
  console.warn('⚠ Razorpay credentials not configured - payment features disabled');
}

const PLANS = {
  free: { amount: 0, currency: 'INR' },
  pro: { amount: 1900, currency: 'INR' },     // ₹19 × 100 (paise)
  team: { amount: 4900, currency: 'INR' },    // ₹49 × 100 (paise)
};

export async function createOrder({ userId, plan, receipt, amount: customAmount }) {
  if (!razorpay) {
    throw new Error('Payment service not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }
  
  // Handle credit pack purchases (custom amount)
  let orderAmount;
  let currency = 'INR';
  
  if (customAmount) {
    orderAmount = customAmount;
  } else {
    const planConfig = PLANS[plan];
    if (!planConfig || planConfig.amount === 0) {
      throw new Error('Invalid plan or free plan does not require payment');
    }
    orderAmount = planConfig.amount;
    currency = planConfig.currency;
  }
  
  const order = await razorpay.orders.create({
    amount: orderAmount,
    currency,
    receipt: receipt || `rcpt_${userId.slice(-8)}_${Date.now().toString(36)}`,
    notes: { userId, plan },
  });
  return order;
}

export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === razorpaySignature;
}

export function verifyWebhookSignature(payload, signature) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured');
    return false;
  }
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return expectedSignature === signature;
}

export async function getSubscriptionDetails(subscriptionId) {
  if (!razorpay) {
    throw new Error('Payment service not configured');
  }
  return razorpay.subscriptions.fetch(subscriptionId);
}

export async function cancelRazorpaySubscription(subscriptionId) {
  if (!razorpay) {
    throw new Error('Payment service not configured');
  }
  return razorpay.subscriptions.cancel(subscriptionId);
}

export { PLANS };
