import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getSubscription,
  cancelUserSubscription,
  getPurchaseHistory,
  getPurchaseStats,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.post('/webhook', handleWebhook);
router.get('/subscription', authenticate, getSubscription);
router.post('/cancel', authenticate, cancelUserSubscription);
router.get('/history', authenticate, getPurchaseHistory);
router.get('/stats', authenticate, getPurchaseStats);

export default router;
