import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getStats,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  listTemplatesAdmin,
  createTemplateAdmin,
  updateTemplateAdmin,
  deleteTemplateAdmin,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getServices,
  getCreditSummary,
  grantCredits,
  getApiKeyFailures,
  resetApiKeyFailures,
  getApiKeyUsageLogs,
  getApiKeyUsageStats,
} from '../controllers/adminController.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getStats);

router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/templates', listTemplatesAdmin);
router.post('/templates', createTemplateAdmin);
router.patch('/templates/:id', updateTemplateAdmin);
router.delete('/templates/:id', deleteTemplateAdmin);

router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.patch('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

router.get('/services', getServices);

router.get('/credits/summary', getCreditSummary);
router.post('/credits/grant', grantCredits);

// API key failure tracking
router.get('/api-key-failures', getApiKeyFailures);
router.post('/api-key-failures/:id/reset', resetApiKeyFailures);

// API key usage tracking
router.get('/api-key-usage', getApiKeyUsageLogs);
router.get('/api-key-usage/stats', getApiKeyUsageStats);

export default router;
