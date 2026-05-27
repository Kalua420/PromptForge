// CREDIT-ONLY SYSTEM - No monthly subscription plans

// Credit packs for all users (pay-as-you-go only)
export const CREDIT_PACKS = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 20,
    price: 19,        // ₹19 for 20 credits
    pricePerCredit: 0.95,
    bonus: 0,
    popular: false,
  },
  standard: {
    id: 'standard',
    name: 'Standard Pack',
    credits: 100,
    price: 79,        // ₹79 for 100 credits (~21% cheaper per credit)
    pricePerCredit: 0.79,
    bonus: 10,        // +10 bonus credits
    popular: true,
  },
  premium: {
    id: 'premium',
    name: 'Premium Pack',
    credits: 250,
    price: 149,       // ₹149 for 250 credits (~37% cheaper per credit)
    pricePerCredit: 0.596,
    bonus: 50,        // +50 bonus credits
    popular: false,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 600,
    price: 299,       // ₹299 for 600 credits (~47% cheaper per credit)
    pricePerCredit: 0.498,
    bonus: 150,       // +150 bonus credits
    popular: false,
  },
};

// Credit cost per prompt generation (varies by provider)
export const CREDIT_COSTS = {
  groq: 1, // Fastest, cheapest
  sambanova: 2, // SambaNova, mid-range performance
  anthropic: 3, // Claude, more expensive
  gemini: 2, // Gemini, mid-range
  opencode: 1, // DeepSeek, cheap
};

// All users are on credit-based system - no subscription tiers
// Features are available to all users as long as they have credits

export const DEFAULT_FEATURES = {
  allowedProviders: ['groq', 'sambanova', 'anthropic', 'opencode', 'gemini'],
  domainStrategies: 5,
  customStrategies: false,
  aiClarifyingQuestions: true,
  realtimeStreaming: true,
  templateMarketplaceAccess: true,
  templateDomainsUnlocked: 5,
  canPublishTemplates: true,
  historyRetentionDays: 'unlimited',
  canForkPrompts: true,
  canSearchHistory: true,
  canExportPrompts: true,
  usageAnalytics: true,
  providerCostComparison: true,
  supportTier: 'email',
};

export function hasFeature(feature) {
  const value = DEFAULT_FEATURES[feature];
  if (typeof value === 'boolean') return value;
  if (value === 'unlimited') return true;
  return !!value;
}

export function getLimit(limitKey) {
  const value = DEFAULT_FEATURES[limitKey];
  return value === 'unlimited' ? null : (typeof value === 'number' ? value : null);
}
