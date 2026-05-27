import { Router } from 'express';
import {
  getBalance,
  getTransactions,
  getPacks,
  getPackById,
  createCreditOrder,
  verifyCreditPayment,
} from '../controllers/creditController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/balance', authenticate, getBalance);
router.get('/transactions', authenticate, getTransactions);
router.get('/packs', getPacks); // Public endpoint
router.get('/packs/:packId', getPackById); // Public endpoint
router.post('/purchase', authenticate, createCreditOrder);
router.post('/verify', authenticate, verifyCreditPayment);

export default router;
