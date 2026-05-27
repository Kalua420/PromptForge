import { Router } from 'express';
import { listPlans, getInvoicePreview } from '../controllers/subscriptionController.js';

const router = Router();

router.get('/plans', listPlans);
router.get('/invoice-preview', getInvoicePreview);

export default router;
