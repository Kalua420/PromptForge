import { prisma } from '../src/index.js';
import { promptEngine } from '../services/promptEngine.js';
import { generateQuestions } from '../services/refineService.js';

import { USE_CASES, PROVIDERS } from '../config/constants.js';
import { getCreditCost, hasEnoughCredits, deductCredits, getCreditBalance } from '../services/creditService.js';

function validateProvider(provider) {
  return !provider || PROVIDERS.includes(provider);
}

function validateUseCase(useCase) {
  return USE_CASES.includes(useCase);
}

/**
 * Merges user-provided refinement answers into the original content
 * so that the prompt engine and AI receive the full context.
 *
 * @param {string} content - Original prompt draft
 * @param {Object} [answers] - Map of { questionId: selectedOption }
 * @returns {string} Enriched content string
 */
function mergeAnswersIntoContent(content, answers) {
  if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
    return content;
  }

  const answerLines = Object.entries(answers)
    .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
    .join('\n');

  return `${content}\n\nAdditional context from user:\n${answerLines}`;
}

// ─── Prompt CRUD ──────────────────────────────────────────────────────────────

export async function getPrompts(req, res) {
  const { conversationId, cursor, limit = 50 } = req.query;
  const where = { userId: req.user.userId };
  if (conversationId) where.conversationId = conversationId;

  const take = Math.min(parseInt(limit) || 50, 100);
  const queryOptions = { where, orderBy: { createdAt: 'desc' }, take };

  if (cursor) {
    queryOptions.cursor = { id: cursor };
    queryOptions.skip = 1;
  }

  const prompts = await prisma.prompt.findMany(queryOptions);
  const nextCursor = prompts.length === take ? prompts[prompts.length - 1].id : null;

  res.json({ prompts, nextCursor });
}

export async function getPrompt(req, res) {
  const prompt = await prisma.prompt.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
    include: { generations: { orderBy: { createdAt: 'desc' } } },
  });
  if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
  res.json(prompt);
}

export async function createPrompt(req, res) {
  const { title, content, useCase, provider, conversationId } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  if (typeof title !== 'string' || title.length > 500) return res.status(400).json({ error: 'Title must be under 500 characters' });
  if (typeof content !== 'string' || content.length > 50000) return res.status(400).json({ error: 'Content must be under 50000 characters' });
  if (useCase && !validateUseCase(useCase)) return res.status(400).json({ error: 'Invalid use case. Must be one of: ' + USE_CASES.join(', ') });
  if (!validateProvider(provider)) return res.status(400).json({ error: 'Invalid provider. Must be one of: ' + PROVIDERS.join(', ') });

  const prompt = await prisma.prompt.create({
    data: { title, content, useCase, provider, userId: req.user.userId, conversationId: conversationId || undefined },
  });

  if (conversationId) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  res.status(201).json(prompt);
}

export async function deletePrompt(req, res) {
  const prompt = await prisma.prompt.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
  if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
  await prisma.prompt.delete({ where: { id: prompt.id } });
  res.json({ success: true });
}

// ─── Prompt Generation & Refinement ──────────────────────────────────────────

/**
 * POST /prompts/refine
 * Returns clarifying questions based on the user's draft and use case.
 */
export async function refinePrompt(req, res) {
  const { content, useCase, provider } = req.body;
  if (!content || !useCase) return res.status(400).json({ error: 'Content and use case required' });
  if (!validateUseCase(useCase)) return res.status(400).json({ error: 'Invalid use case. Must be one of: ' + USE_CASES.join(', ') });
  if (!validateProvider(provider)) return res.status(400).json({ error: 'Invalid provider. Must be one of: ' + PROVIDERS.join(', ') });
  if (content.length > 50000) return res.status(400).json({ error: 'Content too long' });

  try {
    const questions = await generateQuestions(useCase, content, provider);
    res.json({ questions });
  } catch (err) {
    console.error('Refine prompt error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate refinement questions' });
  }
}

/**
 * POST /prompts/generate
 * Generates an optimised prompt from the user's draft + optional refinement answers.
 *
 * Body:
 *   content    {string}  - The user's raw prompt idea
 *   useCase    {string}  - One of the supported use cases
 *   provider   {string}  - Target AI provider (optional)
 *   answers    {Object}  - Map of { questionId: selectedOption } from the refine step (optional)
 */
export async function generatePrompt(req, res) {
  const { content, useCase, provider, answers } = req.body;
  if (!content || !useCase) return res.status(400).json({ error: 'Content and use case required' });
  if (!validateUseCase(useCase)) return res.status(400).json({ error: 'Invalid use case. Must be one of: ' + USE_CASES.join(', ') });
  if (!validateProvider(provider)) return res.status(400).json({ error: 'Invalid provider. Must be one of: ' + PROVIDERS.join(', ') });
  if (content.length > 50000) return res.status(400).json({ error: 'Content too long' });

  // Validate answers shape if provided
  if (answers !== undefined && (typeof answers !== 'object' || Array.isArray(answers))) {
    return res.status(400).json({ error: 'Answers must be a key-value object' });
  }

  try {
    const userId = req.user.userId;

    // Check credit balance
    const creditCost = getCreditCost(provider);
    if (!await hasEnoughCredits(userId, creditCost)) {
      const balance = await getCreditBalance(userId);
      return res.status(403).json({
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        balance,
        required: creditCost,
      });
    }

    // Merge refinement answers into the content before engine processing
    const enrichedContent = mergeAnswersIntoContent(content, answers);
    const optimized = await promptEngine(useCase, enrichedContent, provider);

    // Deduct credits after successful generation
    try {
      await deductCredits(userId, creditCost, `Prompt generation using ${provider}`, { provider, useCase });
    } catch (creditError) {
      console.error('Credit deduction error:', creditError);
    }

    res.json({ optimized });
  } catch (err) {
    console.error('Generate prompt error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate prompt' });
  }
}
