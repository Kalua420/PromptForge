import { prisma } from '../src/index.js';
import {
  getTemplatesByCredits,
  getTemplatesByTier,
  getRecommendedTemplates,
  getTemplatesForPack,
  getTemplateSuggestions,
  getTemplateWithCostBreakdown,
  getTemplatesByProvider,
  getTemplatesByUseCase,
  createTemplateWithTier,
} from '../services/templateService.js';

/**
 * GET /api/templates
 * Get templates filtered by user's credit balance
 * Query params:
 *   - category: filter by category
 *   - search: search by title
 *   - featured: show only featured templates
 *   - tier: group by tier (free, starter, standard, premium, enterprise)
 *   - provider: filter by provider
 *   - useCase: filter by use case
 *   - pack: show templates available with this credit pack
 *   - suggestions: get personalized suggestions
 */
export async function getTemplates(req, res) {
  try {
    const { category, search, featured, tier, provider, useCase, pack, suggestions, plan } = req.query;
    const userId = req.user?.userId;
    
    // If user is authenticated, use credit-based filtering
    if (userId) {
      // Get personalized suggestions
      if (suggestions === 'true') {
        const suggestions = await getTemplateSuggestions(userId);
        return res.json(suggestions);
      }
      
      // Get templates for specific pack
      if (pack) {
        const templates = await getTemplatesForPack(pack, userId);
        return res.json(templates);
      }
      
      // Get templates grouped by tier
      if (tier === 'true') {
        const templates = await getTemplatesByTier(userId, { category, search, featured, plan });
        return res.json(templates);
      }
      
      // Get recommended templates
      if (featured === 'true') {
        const templates = await getRecommendedTemplates(userId, { category });
        return res.json(templates);
      }
      
      // Get templates by provider
      if (provider) {
        const templates = await getTemplatesByProvider(provider, userId);
        return res.json(templates);
      }
      
      // Get templates by use case
      if (useCase) {
        const templates = await getTemplatesByUseCase(useCase, userId);
        return res.json(templates);
      }
      
      // Default: get all templates filtered by credits, with optional plan filter
      const templates = await getTemplatesByCredits(userId, { category, search, featured, plan });
      return res.json(templates);
    }
    
    // If user is not authenticated, return all templates without credit filtering
    const where = {};
    if (category) where.category = category;
    if (featured) where.featured = true;
    if (search) where.title = { contains: search };
    if (plan) where.plan = plan;
    
    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(templates.map(t => ({
      ...t,
      canUse: false,
      providers: t.providers ? t.providers.split(',').map(p => p.trim()) : [],
    })));
  } catch (err) {
    console.error('Get templates error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch templates' });
  }
}

/**
 * GET /api/templates/:id
 * Get single template with cost breakdown
 */
export async function getTemplate(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const template = await getTemplateWithCostBreakdown(id, userId);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (err) {
    console.error('Get template error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch template' });
  }
}

/**
 * POST /api/templates
 * Create new template (admin only)
 */
export async function createTemplate(req, res) {
  try {
    const { title, description, category, content, tier, featured, recommendedFor, providers, useCase } = req.body;
    
    if (!title || !description || !category || !content) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    if (title.length > 500) {
      return res.status(400).json({ error: 'Title must be under 500 characters' });
    }
    
    if (description.length > 2000) {
      return res.status(400).json({ error: 'Description must be under 2000 characters' });
    }
    
    if (content.length > 50000) {
      return res.status(400).json({ error: 'Content must be under 50000 characters' });
    }
    
    const template = await createTemplateWithTier({
      title,
      description,
      category,
      content,
      tier: tier || 'free',
      featured: featured || false,
      recommendedFor,
      providers: providers || [],
      useCase,
    });
    
    res.status(201).json({
      ...template,
      providers: template.providers ? template.providers.split(',').map(p => p.trim()) : [],
    });
  } catch (err) {
    console.error('Create template error:', err);
    res.status(500).json({ error: err.message || 'Failed to create template' });
  }
}
