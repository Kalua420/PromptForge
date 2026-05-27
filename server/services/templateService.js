/**
 * Template Service
 * Handles credit-based template filtering and recommendations
 */

import { prisma } from '../src/index.js';
import { getCreditBalance } from './creditService.js';
import { CREDIT_PACKS, CREDIT_COSTS } from '../config/tiers.js';

/**
 * Get templates filtered by user's credit balance
 * Shows templates the user can afford based on their current credits
 */
export async function getTemplatesByCredits(userId, options = {}) {
  const { category, search, featured, plan, limit = 50 } = options;
  
  // Get user's current credit balance
  const userCredits = await getCreditBalance(userId);
  
  // Build query
  const where = {};
  if (category) where.category = category;
  if (featured) where.featured = true;
  if (search) where.title = { contains: search };
  if (plan) where.plan = plan;
  
  // Get all templates
  const templates = await prisma.template.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  
  // Filter and enrich templates with credit information
  return templates.map(template => ({
    ...template,
    canUse: userCredits >= template.minCreditsRequired,
    userCredits,
    creditsNeeded: Math.max(0, template.minCreditsRequired - userCredits),
    recommendedPack: template.recommendedFor,
    providers: template.providers ? template.providers.split(',').map(p => p.trim()) : [],
    useCase: template.useCase,
  }));
}

/**
 * Get templates grouped by credit tier
 * Useful for showing users what templates they can unlock with more credits
 */
export async function getTemplatesByTier(userId, options = {}) {
  const { category, search, featured, plan } = options;
  
  const userCredits = await getCreditBalance(userId);
  
  const where = {};
  if (category) where.category = category;
  if (featured) where.featured = true;
  if (search) where.title = { contains: search };
  if (plan) where.plan = plan;
  
  const templates = await prisma.template.findMany({
    where,
    orderBy: { minCreditsRequired: 'asc', createdAt: 'desc' },
  });
  
  // Group by tier
  const tiers = {
    free: [],
    starter: [],
    standard: [],
    premium: [],
    enterprise: [],
  };
  
  templates.forEach(template => {
    const tier = getTemplateTier(template.minCreditsRequired);
    tiers[tier].push({
      ...template,
      canUse: userCredits >= template.minCreditsRequired,
      userCredits,
      creditsNeeded: Math.max(0, template.minCreditsRequired - userCredits),
      tier,
    });
  });
  
  return tiers;
}

/**
 * Get recommended templates based on user's credit balance
 * Shows templates they can use now + templates to unlock with next purchase
 */
export async function getRecommendedTemplates(userId, options = {}) {
  const { category, limit = 10 } = options;
  
  const userCredits = await getCreditBalance(userId);
  
  const where = { featured: true };
  if (category) where.category = category;
  
  const templates = await prisma.template.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit * 2, // Get more to filter
  });
  
  // Separate into accessible and upcoming
  const accessible = [];
  const upcoming = [];
  
  templates.forEach(template => {
    const enriched = {
      ...template,
      canUse: userCredits >= template.minCreditsRequired,
      userCredits,
      creditsNeeded: Math.max(0, template.minCreditsRequired - userCredits),
      recommendedPack: template.recommendedFor,
    };
    
    if (enriched.canUse) {
      accessible.push(enriched);
    } else {
      upcoming.push(enriched);
    }
  });
  
  return {
    accessible: accessible.slice(0, limit),
    upcoming: upcoming.slice(0, limit),
    userCredits,
  };
}

/**
 * Get templates for a specific credit pack
 * Shows what templates become available with this pack
 */
export async function getTemplatesForPack(packId, userId = null) {
  const pack = CREDIT_PACKS[packId];
  if (!pack) throw new Error('Invalid credit pack');
  
  const totalCredits = pack.credits + pack.bonus;
  
  // Get templates that would be unlocked with this pack
  const templates = await prisma.template.findMany({
    where: {
      minCreditsRequired: {
        lte: totalCredits,
      },
    },
    orderBy: { minCreditsRequired: 'desc' },
  });
  
  if (!userId) {
    return templates.map(t => ({
      ...t,
      canUse: true,
      providers: t.providers ? t.providers.split(',').map(p => p.trim()) : [],
    }));
  }
  
  const userCredits = await getCreditBalance(userId);
  
  return templates.map(t => ({
    ...t,
    canUseNow: userCredits >= t.minCreditsRequired,
    canUseWithPack: true,
    providers: t.providers ? t.providers.split(',').map(p => p.trim()) : [],
  }));
}

/**
 * Get template tier based on credit requirement
 */
export function getTemplateTier(minCredits) {
  if (minCredits === 0) return 'free';
  if (minCredits <= 100) return 'starter';
  if (minCredits <= 500) return 'standard';
  if (minCredits <= 1000) return 'premium';
  return 'enterprise';
}

/**
 * Get credit requirement for a tier
 */
export function getCreditRequirementForTier(tier) {
  const requirements = {
    free: 0,
    starter: 50,
    standard: 200,
    premium: 500,
    enterprise: 1000,
  };
  return requirements[tier] || 0;
}

/**
 * Create template with credit tier
 */
export async function createTemplateWithTier(data) {
  const {
    title,
    description,
    category,
    content,
    tier = 'free',
    featured = false,
    recommendedFor = null,
    providers = [],
    useCase = null,
  } = data;
  
  const minCreditsRequired = getCreditRequirementForTier(tier);
  
  const template = await prisma.template.create({
    data: {
      title,
      description,
      category,
      content,
      plan: tier,
      featured,
      minCreditsRequired,
      recommendedFor,
      providers: providers.length > 0 ? providers.join(', ') : null,
      useCase,
    },
  });
  
  return template;
}

/**
 * Get templates by provider
 * Shows templates optimized for specific providers
 */
export async function getTemplatesByProvider(provider, userId = null) {
  const templates = await prisma.template.findMany({
    where: {
      providers: {
        contains: provider,
      },
    },
    orderBy: { minCreditsRequired: 'asc' },
  });
  
  if (!userId) {
    return templates.map(t => ({
      ...t,
      providers: t.providers ? t.providers.split(',').map(p => p.trim()) : [],
    }));
  }
  
  const userCredits = await getCreditBalance(userId);
  
  return templates.map(t => ({
    ...t,
    canUse: userCredits >= t.minCreditsRequired,
    userCredits,
    creditsNeeded: Math.max(0, t.minCreditsRequired - userCredits),
    providers: t.providers ? t.providers.split(',').map(p => p.trim()) : [],
  }));
}

/**
 * Get templates by use case
 * Shows templates for specific task categories
 */
export async function getTemplatesByUseCase(useCase, userId = null) {
  const templates = await prisma.template.findMany({
    where: {
      useCase,
    },
    orderBy: { minCreditsRequired: 'asc' },
  });
  
  if (!userId) {
    return templates.map(t => ({
      ...t,
      providers: t.providers ? t.providers.split(',').map(p => p.trim()) : [],
    }));
  }
  
  const userCredits = await getCreditBalance(userId);
  
  return templates.map(t => ({
    ...t,
    canUse: userCredits >= t.minCreditsRequired,
    userCredits,
    creditsNeeded: Math.max(0, t.minCreditsRequired - userCredits),
    providers: t.providers ? t.providers.split(',').map(p => p.trim()) : [],
  }));
}

/**
 * Get template suggestions based on user's credit balance
 * Recommends next templates to try and packs to buy
 */
export async function getTemplateSuggestions(userId) {
  const userCredits = await getCreditBalance(userId);
  
  // Get templates user can use now
  const canUseNow = await prisma.template.findMany({
    where: {
      minCreditsRequired: {
        lte: userCredits,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  
  // Get templates just out of reach
  const almostThere = await prisma.template.findMany({
    where: {
      minCreditsRequired: {
        gt: userCredits,
        lte: userCredits + 100, // Within 100 credits
      },
    },
    orderBy: { minCreditsRequired: 'asc' },
    take: 3,
  });
  
  // Get premium templates to aspire to
  const premium = await prisma.template.findMany({
    where: {
      minCreditsRequired: {
        gt: userCredits + 100,
      },
    },
    orderBy: { minCreditsRequired: 'asc' },
    take: 3,
  });
  
  return {
    userCredits,
    canUseNow: canUseNow.map(t => ({
      ...t,
      providers: t.providers ? t.providers.split(',').map(p => p.trim()) : [],
    })),
    almostThere: almostThere.map(t => ({
      ...t,
      creditsNeeded: t.minCreditsRequired - userCredits,
      providers: t.providers ? t.providers.split(',').map(p => p.trim()) : [],
    })),
    premium: premium.map(t => ({
      ...t,
      creditsNeeded: t.minCreditsRequired - userCredits,
      providers: t.providers ? t.providers.split(',').map(p => p.trim()) : [],
    })),
  };
}

/**
 * Calculate cost to use a template
 * Returns the cheapest provider cost for the template
 */
export function getTemplateCost(providers = []) {
  if (providers.length === 0) return 1; // Default to Groq cost
  
  const costs = providers.map(p => CREDIT_COSTS[p] || 1);
  return Math.min(...costs);
}

/**
 * Get template with cost breakdown
 */
export async function getTemplateWithCostBreakdown(templateId, userId = null) {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });
  
  if (!template) return null;
  
  const providers = template.providers ? template.providers.split(',').map(p => p.trim()) : [];
  const costBreakdown = providers.map(p => ({
    provider: p,
    cost: CREDIT_COSTS[p] || 1,
  }));
  
  const minCost = getTemplateCost(providers);
  
  const enriched = {
    ...template,
    providers,
    costBreakdown,
    minCost,
    providers: template.providers ? template.providers.split(',').map(p => p.trim()) : [],
  };
  
  if (userId) {
    const userCredits = await getCreditBalance(userId);
    enriched.canUse = userCredits >= template.minCreditsRequired;
    enriched.userCredits = userCredits;
    enriched.creditsNeeded = Math.max(0, template.minCreditsRequired - userCredits);
  }
  
  return enriched;
}
