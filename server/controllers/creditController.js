import { prisma } from '../src/index.js';
import {
  getCreditBalance,
  getCreditTransactions,
  getAllCreditPacks,
  getCreditPack,
  processCreditPurchase,
} from '../services/creditService.js';
import { createOrder, verifyPaymentSignature } from '../services/razorpayService.js';
import { sendPurchaseConfirmation } from '../services/emailService.js';

/**
 * Get user's credit balance
 */
export async function getBalance(req, res) {
  try {
    const userId = req.user.userId;
    const balance = await getCreditBalance(userId);
    res.json({ credits: balance });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    res.status(500).json({ error: 'Failed to fetch credit balance' });
  }
}

/**
 * Get credit transaction history
 */
export async function getTransactions(req, res) {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const transactions = await getCreditTransactions(userId, limit);
    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

/**
 * Get available credit packs
 */
export async function getPacks(req, res) {
  try {
    const packs = await prisma.creditPack.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ packs });
  } catch (error) {
    console.error('Error fetching credit packs:', error);
    res.status(500).json({ error: 'Failed to fetch credit packs' });
  }
}

/**
 * Get single credit pack by ID
 */
export async function getPackById(req, res) {
  try {
    const { packId } = req.params;
    const pack = await prisma.creditPack.findUnique({
      where: { id: packId },
    });
    
    if (!pack) {
      return res.status(404).json({ error: 'Credit pack not found' });
    }
    
    res.json({ pack });
  } catch (error) {
    console.error('Error fetching credit pack:', error);
    res.status(500).json({ error: 'Failed to fetch credit pack' });
  }
}

/**
 * Create payment order for credit pack purchase
 */
export async function createCreditOrder(req, res) {
  try {
    const { packId } = req.body;
    const userId = req.user.userId;
    
    // Get pack from database
    const pack = await prisma.creditPack.findUnique({ where: { id: packId } });
    if (!pack || !pack.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive credit pack' });
    }
    
    const amount = pack.priceInPaise;
    const totalCredits = pack.credits + pack.bonusCredits;
    
    const order = await createOrder({
      userId,
      plan: `credit_${packId}`,
      receipt: `credit_${userId.slice(-8)}_${Date.now().toString(36)}`,
      amount,
    });
    
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        currency: 'INR',
        status: 'pending',
        razorpayOrderId: order.id,
        creditPackId: packId,
        creditsGranted: totalCredits,
      },
    });
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: payment.id,
      pack: {
        id: pack.id,
        name: pack.name,
        credits: pack.credits,
        bonusCredits: pack.bonusCredits,
        priceInPaise: pack.priceInPaise,
        totalCredits,
      },
    });
  } catch (error) {
    console.error('Error creating credit order:', error);
    res.status(500).json({ error: 'Failed to create credit order' });
  }
}

/**
 * Verify credit pack payment and add credits
 */
export async function verifyCreditPayment(req, res) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user.userId;
    
    const isValid = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }
    
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (payment.status === 'completed') {
      return res.json({ success: true, message: 'Payment already verified' });
    }
    
    const packId = payment.creditPackId;
    
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'completed',
          razorpayPaymentId,
          signature: razorpaySignature,
        },
      });
      
      // Add credits to user balance
      await processCreditPurchase(userId, packId);
    });
    
    const newBalance = await getCreditBalance(userId);
    
    // Get user and pack details for email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const pack = await prisma.creditPack.findUnique({ where: { id: packId } });
    const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    
    // Send purchase confirmation email (non-blocking)
    if (user && pack && updatedPayment) {
      sendPurchaseConfirmation(user, updatedPayment, pack).catch(err => 
        console.error('Failed to send purchase confirmation email:', err.message)
      );
    }
    
    res.json({
      success: true,
      message: 'Credits added successfully',
      credits: newBalance,
    });
  } catch (error) {
    console.error('Error verifying credit payment:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
}
