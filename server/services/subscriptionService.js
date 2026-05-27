import { hasFeature } from '../config/tiers.js';

export async function createFreeSubscription(userId) {
  return null;
}

export async function checkEntitlement(userId, feature, context) {
  if (feature === 'allowedProviders') {
    return { allowed: true };
  }

  if (feature === 'promptsPerMonth') {
    return { allowed: true };
  }

  const allowed = hasFeature(feature);

  if (!allowed) {
    return {
      allowed: false,
      reason: `Feature "${feature}" is not available.`,
    };
  }

  return { allowed: true };
}
