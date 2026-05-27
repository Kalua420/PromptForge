import { prisma } from '../src/index.js';

const FAIL_THRESHOLD = 3; // Mark key as problematic after 3 consecutive failures
const FAIL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown for failed keys

/**
 * Get an active API key for a provider — database only
 * @param {string} provider - Provider name (groq, sambanova, etc.)
 * @returns {Promise<{key: string, id: string} | null>}
 */
export async function getApiKey(provider) {
  const dbKeys = await prisma.apiKey.findMany({
    where: { provider, isActive: true },
    orderBy: [
      { priority: 'desc' },
      { failCount: 'asc' },
      { lastUsedAt: 'asc' },
    ],
  });

  const now = new Date();
  const availableKeys = dbKeys.filter(key => {
    if (key.failCount < FAIL_THRESHOLD) return true;
    if (!key.lastFailAt) return true;
    return now >= new Date(key.lastFailAt.getTime() + FAIL_COOLDOWN_MS);
  });

  if (availableKeys.length === 0) return null;

  const topPriority = availableKeys[0].priority;
  const topKeys = availableKeys.filter(k => k.priority === topPriority);
  const selected = topKeys[Math.floor(Math.random() * topKeys.length)];

  prisma.apiKey.update({
    where: { id: selected.id },
    data: { lastUsedAt: now },
  }).catch(err => console.error('Failed to update API key lastUsedAt:', err.message));

  return { key: selected.apiKey, id: selected.id };
}

/**
 * Get all active API keys for a provider (for sequential failover)
 * @param {string} provider - Provider name
 * @returns {Promise<Array<{key: string, id: string}>>}
 */
export async function getAllApiKeys(provider) {
  const dbKeys = await prisma.apiKey.findMany({
    where: { provider, isActive: true },
    orderBy: [
      { priority: 'desc' },
      { failCount: 'asc' },
    ],
  });

  return dbKeys.map(k => ({ key: k.apiKey, id: k.id }));
}

/**
 * Mark an API key as successful (reset fail count)
 * @param {string} keyId - API key ID (null for env keys)
 */
export async function markKeySuccess(keyId) {
  if (!keyId) return; // Skip for env keys

  await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      failCount: 0,
      lastFailAt: null,
    },
  }).catch(err => console.error('Failed to mark key success:', err.message));
}

/**
 * Mark an API key as failed (increment fail count) and log the failure event
 * @param {string} keyId - API key ID (null for env keys)
 * @param {object} [errorInfo] - Optional error details { code, message }
 */
export async function markKeyFailure(keyId, errorInfo = {}) {
  if (!keyId) return; // Skip for env keys

  const now = new Date();

  // Update fail count and timestamp
  const updated = await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      failCount: { increment: 1 },
      lastFailAt: now,
    },
    select: { provider: true },
  }).catch(err => { console.error('Failed to mark key failure:', err.message); return null; });

  if (!updated) return;

  // Write a failure log entry (fire-and-forget, non-blocking)
  prisma.apiKeyFailureLog.create({
    data: {
      apiKeyId: keyId,
      provider: updated.provider,
      errorCode: errorInfo.code != null ? String(errorInfo.code) : null,
      errorMsg: errorInfo.message ? String(errorInfo.message).slice(0, 1000) : null,
    },
  }).catch(err => console.error('Failed to write API key failure log:', err.message));
}

/**
 * Reset fail count for a key (admin action)
 * @param {string} keyId
 */
export async function resetKeyFailures(keyId) {
  return await prisma.apiKey.update({
    where: { id: keyId },
    data: { failCount: 0, lastFailAt: null },
  });
}

/**
 * Get recent failure logs, optionally filtered by provider or keyId
 * @param {object} opts - { provider?, keyId?, limit? }
 */
export async function getFailureLogs({ provider, keyId, limit = 100 } = {}) {
  const where = {};
  if (provider) where.provider = provider;
  if (keyId) where.apiKeyId = keyId;

  return await prisma.apiKeyFailureLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      apiKeyId: true,
      provider: true,
      errorCode: true,
      errorMsg: true,
      createdAt: true,
      apiKey: {
        select: { label: true, isActive: true, failCount: true },
      },
    },
  });
}

/**
 * Get a summary of failing keys (failCount >= threshold) across all providers
 */
export async function getFailingSummary() {
  const keys = await prisma.apiKey.findMany({
    where: { failCount: { gt: 0 } },
    orderBy: [{ failCount: 'desc' }, { lastFailAt: 'desc' }],
    select: {
      id: true,
      provider: true,
      label: true,
      isActive: true,
      failCount: true,
      lastFailAt: true,
      lastUsedAt: true,
      priority: true,
    },
  });
  return keys;
}

/**
 * Check if a provider has any available API keys in the database
 * @param {string} provider - Provider name
 * @returns {Promise<boolean>}
 */
export async function hasApiKey(provider) {
  const count = await prisma.apiKey.count({
    where: { provider, isActive: true },
  });
  return count > 0;
}

/**
 * Get all providers that have active API keys in the database
 * @returns {Promise<string[]>}
 */
export async function getAvailableProviders() {
  const rows = await prisma.apiKey.findMany({
    where: { isActive: true },
    select: { provider: true },
    distinct: ['provider'],
  });
  return rows.map(r => r.provider);
}

/**
 * Add a new API key for a provider
 * @param {string} provider - Provider name
 * @param {string} apiKey - API key value
 * @param {string} label - Optional label
 * @param {number} priority - Priority (default 0)
 * @returns {Promise<object>}
 */
export async function addApiKey(provider, apiKey, label = null, priority = 0) {
  return await prisma.apiKey.create({
    data: {
      provider,
      apiKey,
      label,
      priority,
    },
  });
}

/**
 * Get a single API key by ID (admin view — returns masked key for display)
 * @param {string} id - API key ID
 * @returns {Promise<object|null>}
 */
export async function getKeyById(id) {
  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (!key) return null;
  // Mask the key: show first 6 and last 4 chars, rest as *
  const raw = key.apiKey;
  const masked =
    raw.length <= 10
      ? '*'.repeat(raw.length)
      : raw.slice(0, 6) + '*'.repeat(Math.max(0, raw.length - 10)) + raw.slice(-4);
  return { ...key, apiKeyMasked: masked, apiKey: undefined };
}

/**
 * Update an API key including the key value itself
 * @param {string} id - API key ID
 * @param {object} data - Update data (may include apiKey)
 * @returns {Promise<object>}
 */
export async function updateApiKey(id, data) {
  return await prisma.apiKey.update({
    where: { id },
    data,
  });
}

/**
 * Delete an API key
 * @param {string} id - API key ID
 * @returns {Promise<object>}
 */
export async function deleteApiKey(id) {
  return await prisma.apiKey.delete({
    where: { id },
  });
}

/**
 * Get all API keys for a provider (admin view)
 * @param {string} provider - Provider name (optional)
 * @returns {Promise<Array>}
 */
export async function listApiKeys(provider = null) {
  const where = provider ? { provider } : {};
  return await prisma.apiKey.findMany({
    where,
    orderBy: [
      { provider: 'asc' },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      provider: true,
      label: true,
      isActive: true,
      priority: true,
      lastUsedAt: true,
      failCount: true,
      lastFailAt: true,
      createdAt: true,
      // Don't expose the actual API key in list view
      apiKey: false,
    },
  });
}

/**
 * Get statistics for API keys
 * @returns {Promise<object>}
 */
export async function getApiKeyStats() {
  const keys = await prisma.apiKey.findMany({
    select: {
      provider: true,
      isActive: true,
      failCount: true,
    },
  });

  const stats = {};
  for (const key of keys) {
    if (!stats[key.provider]) {
      stats[key.provider] = {
        total: 0,
        active: 0,
        failing: 0,
      };
    }
    stats[key.provider].total++;
    if (key.isActive) stats[key.provider].active++;
    if (key.failCount >= FAIL_THRESHOLD) stats[key.provider].failing++;
  }

  return stats;
}
