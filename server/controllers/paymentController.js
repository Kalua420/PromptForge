import { prisma } from '../src/index.js';
import { verifyWebhookSignature } from '../services/razorpayService.js';
import { CREDIT_PACKS } from '../config/tiers.js';
import { sendPaymentSuccessEmail, sendPaymentFailureEmail } from '../services/emailService.js';

export async function createPaymentOrder(req, res) {
  return res.status(400).json({ error: 'Plan subscriptions are no longer available. Purchase credits instead.' });
}

export async function verifyPayment(req, res) {
  return res.status(400).json({ error: 'Plan subscriptions are no longer available. Purchase credits instead.' });
}

export async function handleWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      console.error('Webhook signature missing');
      return res.status(400).json({ error: 'Signature required' });
    }

    const payload = JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(payload, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    console.log(`Webhook received: ${event.event}`);

    switch (event.event) {
      case 'payment.captured': {
        const payment = await prisma.payment.findUnique({
          where: { razorpayOrderId: event.payload.payment.entity.order_id },
          include: { user: true, creditPack: true },
        });
        
        if (payment && payment.status === 'pending') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'completed',
              razorpayPaymentId: event.payload.payment.entity.id,
            },
          });
          console.log(`Payment ${payment.id} marked as completed`);
          
          // Send success email (non-blocking)
          if (payment.user && payment.creditPack) {
            sendPaymentSuccessEmail(payment.user, payment, payment.creditPack).catch(err => 
              console.error('Failed to send payment success email:', err.message)
            );
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = await prisma.payment.findUnique({
          where: { razorpayOrderId: event.payload.payment.entity.order_id },
          include: { user: true },
        });
        
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'failed' },
          });
          console.log(`Payment ${payment.id} marked as failed`);
          
          // Send failure email (non-blocking)
          if (payment.user) {
            const reason = event.payload.payment.entity.error_description || 'Payment processing failed';
            sendPaymentFailureEmail(payment.user, payment, reason).catch(err => 
              console.error('Failed to send payment failure email:', err.message)
            );
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
}

export async function getSubscription(req, res) {
  res.json({ planId: 'free', status: 'active' });
}

export async function cancelUserSubscription(req, res) {
  return res.status(400).json({ error: 'No active subscription to cancel' });
}

/**
 * GET /api/payments/history
 * Get user's purchase history
 */
export async function getPurchaseHistory(req, res) {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Get payments with credit pack details
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        creditPack: true,
      },
    });

    // Get total count
    const total = await prisma.payment.count({
      where: { userId },
    });

    // Enrich payments with pack details
    const enrichedPayments = payments.map(payment => {
      const pack = CREDIT_PACKS[payment.creditPackId] || payment.creditPack;
      const totalCredits = payment.creditsGranted || (pack ? pack.credits + pack.bonus : 0);

      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        creditsGranted: totalCredits,
        packName: pack?.name || 'Unknown Pack',
        packId: payment.creditPackId,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        pricePerCredit: pack ? (payment.amount / totalCredits).toFixed(2) : 'N/A',
      };
    });

    res.json({
      payments: enrichedPayments,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < total,
    });
  } catch (err) {
    console.error('Get purchase history error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch purchase history' });
  }
}

/**
 * GET /api/payments/stats
 * Get purchase statistics
 */
export async function getPurchaseStats(req, res) {
  try {
    const userId = req.user.userId;

    // Get all payments
    const payments = await prisma.payment.findMany({
      where: { userId, status: 'completed' },
    });

    // Calculate stats
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPurchases = payments.length;
    const totalCreditsSpent = payments.reduce((sum, p) => sum + (p.creditsGranted || 0), 0);

    // Get credit transactions to calculate usage
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId, type: 'usage' },
    });

    const totalCreditsUsed = Math.abs(
      transactions.reduce((sum, t) => sum + t.amount, 0)
    );

    // Get current balance
    const balance = await prisma.creditBalance.findUnique({
      where: { userId },
    });

    res.json({
      totalSpent: (totalSpent / 100).toFixed(2), // Convert from paise to rupees
      totalPurchases,
      totalCreditsSpent,
      totalCreditsUsed,
      currentBalance: balance?.credits || 0,
      averagePerPurchase: totalPurchases > 0 ? (totalSpent / totalPurchases / 100).toFixed(2) : 0,
    });
  } catch (err) {
    console.error('Get purchase stats error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch purchase stats' });
  }
}
