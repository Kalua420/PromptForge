import {
  listApiKeys,
  getKeyById,
  addApiKey,
  updateApiKey,
  deleteApiKey,
  getApiKeyStats,
} from '../services/apiKeyService.js';

/**
 * Get all API keys (admin only)
 * GET /api/admin/api-keys
 */
export async function getAllKeys(req, res) {
  try {
    const { provider } = req.query;
    const keys = await listApiKeys(provider || null);
    res.json({ keys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
}

/**
 * Get a single API key by ID with masked value (admin only)
 * GET /api/admin/api-keys/:id
 */
export async function getKey(req, res) {
  try {
    const { id } = req.params;
    const key = await getKeyById(id);
    if (!key) return res.status(404).json({ error: 'API key not found' });
    res.json({ key });
  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({ error: 'Failed to fetch API key' });
  }
}

/**
 * Get API key statistics (admin only)
 * GET /api/admin/api-keys/stats
 */
export async function getStats(req, res) {
  try {
    const stats = await getApiKeyStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching API key stats:', error);
    res.status(500).json({ error: 'Failed to fetch API key statistics' });
  }
}

/**
 * Add a new API key (admin only)
 * POST /api/admin/api-keys
 * Body: { provider, apiKey, label?, priority? }
 */
export async function createKey(req, res) {
  try {
    const { provider, apiKey, label, priority } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and apiKey are required' });
    }

    const validProviders = ['groq', 'sambanova', 'anthropic', 'opencode', 'gemini'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ 
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` 
      });
    }

    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return res.status(400).json({ error: 'API key must be a non-empty string' });
    }

    const key = await addApiKey(
      provider,
      apiKey.trim(),
      label || null,
      priority || 0
    );

    res.status(201).json({ 
      message: 'API key added successfully',
      key: {
        id: key.id,
        provider: key.provider,
        label: key.label,
        priority: key.priority,
        isActive: key.isActive,
        createdAt: key.createdAt,
      }
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
}

/**
 * Update an API key (admin only)
 * PATCH /api/admin/api-keys/:id
 * Body: { label?, priority?, isActive?, apiKey? }
 */
export async function updateKey(req, res) {
  try {
    const { id } = req.params;
    const { label, priority, isActive, apiKey } = req.body;

    const updateData = {};
    if (label !== undefined) updateData.label = label;
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (apiKey !== undefined) {
      if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        return res.status(400).json({ error: 'API key must be a non-empty string' });
      }
      updateData.apiKey = apiKey.trim();
      // Reset failure tracking when key value changes
      updateData.failCount = 0;
      updateData.lastFailAt = null;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    const key = await updateApiKey(id, updateData);

    res.json({ 
      message: 'API key updated successfully',
      key: {
        id: key.id,
        provider: key.provider,
        label: key.label,
        priority: key.priority,
        isActive: key.isActive,
        updatedAt: key.updatedAt,
      }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'API key not found' });
    }
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
}

/**
 * Delete an API key (admin only)
 * DELETE /api/admin/api-keys/:id
 */
export async function deleteKey(req, res) {
  try {
    const { id } = req.params;
    await deleteApiKey(id);
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'API key not found' });
    }
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
}
