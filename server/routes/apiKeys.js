import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getAllKeys,
  getKey,
  getStats,
  createKey,
  updateKey,
  deleteKey,
} from '../controllers/apiKeyController.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// GET /api/admin/api-keys - List all API keys
router.get('/', getAllKeys);

// GET /api/admin/api-keys/stats - Get API key statistics (must be before /:id)
router.get('/stats', getStats);

// GET /api/admin/api-keys/:id - Get single key with masked value
router.get('/:id', getKey);

// POST /api/admin/api-keys - Add new API key
router.post('/', createKey);

// PATCH /api/admin/api-keys/:id - Update API key
router.patch('/:id', updateKey);

// DELETE /api/admin/api-keys/:id - Delete API key
router.delete('/:id', deleteKey);

export default router;
