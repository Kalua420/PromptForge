import { prisma } from '../src/index.js';
import { promptEngine } from '../services/promptEngine.js';
import { getProvider } from '../services/ai/aiManager.js';
import { getCreditCost, hasEnoughCredits, deductCredits, getCreditBalance } from '../services/creditService.js';
import { checkEntitlement } from '../services/subscriptionService.js';

/**
 * Merges refinement answers into the prompt content so the AI
 * receives the full enriched context during streaming generation.
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

const activeGenerations = new Map();
const userRateLimits = new Map(); // Track generation counts per user

// Rate limiting: max 10 generations per minute per user
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimits = userRateLimits.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  
  if (now > userLimits.resetAt) {
    // Reset window
    userRateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimits.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  userLimits.count++;
  userRateLimits.set(userId, userLimits);
  return true;
}

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    const userId = socket.userId; // Set by authenticateSocket middleware
    
    console.log(`Socket connected: ${socket.id} (user: ${userId})`);

    socket.on('generate-stream', async ({ promptId, content, useCase, provider, answers }) => {
      let needsCreditDeduction = false;
      let creditCost = 0;
      
      try {
        // Validate inputs
        if (!promptId || !content || !useCase) {
          socket.emit('error', { error: 'Missing required fields' });
          return;
        }

        // Sanitize content length
        if (typeof content !== 'string' || content.length > 50000) {
          socket.emit('error', { error: 'Content too long (max 50000 characters)' });
          return;
        }

        // Check rate limit
        if (!checkRateLimit(userId)) {
          socket.emit('error', { error: 'Rate limit exceeded. Please wait before generating again.' });
          return;
        }

        // Verify prompt ownership
        const prompt = await prisma.prompt.findFirst({
          where: { id: promptId, userId },
        });

        if (!prompt) {
          socket.emit('error', { error: 'Prompt not found or access denied' });
          return;
        }

        // Validate provider
        const validProviders = ['groq', 'sambanova', 'anthropic', 'opencode', 'gemini'];
        const selectedProvider = provider || 'groq';
        if (!validProviders.includes(selectedProvider)) {
          socket.emit('error', { error: 'Invalid provider' });
          return;
        }

        // ─── CREDIT-ONLY ACCESS CONTROL ───────────────────────────────
        // In credit-only system, all providers are available
        // Access is controlled purely by credit balance
        
        // Check provider entitlement (always allowed in credit-only system)
        const providerCheck = await checkEntitlement(
          userId,
          'allowedProviders',
          { provider: selectedProvider }
        );
        
        if (!providerCheck.allowed) {
          socket.emit('error', { 
            error: providerCheck.reason || 'Provider not allowed',
            code: 'PROVIDER_NOT_ALLOWED',
            provider: selectedProvider,
          });
          return;
        }

        // Check credit balance
        creditCost = getCreditCost(selectedProvider);
        const hasCredits = await hasEnoughCredits(userId, creditCost);
        
        if (!hasCredits) {
          const currentBalance = await getCreditBalance(userId);
          socket.emit('error', {
            error: 'Insufficient credits',
            code: 'INSUFFICIENT_CREDITS',
            balance: currentBalance,
            required: creditCost,
            provider: selectedProvider,
          });
          return;
        }
        
        // Mark for credit deduction after successful generation
        needsCreditDeduction = true;

        const controller = new AbortController();
        activeGenerations.set(socket.id, controller);

        // Merge any refinement answers into the content before optimisation
        const enrichedContent = mergeAnswersIntoContent(content, answers);
        const optimized = await promptEngine(useCase, enrichedContent, selectedProvider);
        const aiProvider = getProvider(selectedProvider);
        let fullText = '';
        let usedApiKeyId = null; // Track which key was actually used

        await aiProvider.streamComplete(
          optimized,
          (token) => {
            if (!controller.signal.aborted) {
              fullText += token;
              socket.emit('token', { token, fullText });
            }
          },
          async () => {
            if (!controller.signal.aborted) {
              // Better token estimate: ~4 chars/token on average, but account for spaces/punctuation
              const tokensUsed = Math.ceil(fullText.split(/\s+/).length * 1.33);
              const generation = await prisma.generation.create({
                data: { 
                  content: fullText, 
                  tokensUsed, 
                  promptId, 
                  provider: selectedProvider,
                  apiKeyId: usedApiKeyId, // Store which key was used
                },
              });
              
              // Log API key usage
              if (usedApiKeyId) {
                prisma.apiKeyUsageLog.create({
                  data: {
                    apiKeyId: usedApiKeyId,
                    provider: selectedProvider,
                    userId,
                    promptId,
                    generationId: generation.id,
                    useCase,
                    tokensUsed,
                    success: true,
                  },
                }).catch(err => console.error('Failed to log API key usage:', err.message));
              }
              
              // Deduct credits after successful generation
              if (needsCreditDeduction) {
                try {
                  const newBalance = await deductCredits(
                    userId,
                    creditCost,
                    `Prompt generation using ${selectedProvider}`,
                    { promptId, provider: selectedProvider, generationId: generation.id }
                  );
                  
                  // Emit credit balance update
                  socket.emit('credit_balance_updated', { balance: newBalance });
                } catch (creditError) {
                  console.error('Credit deduction error:', creditError);
                  // Don't fail the generation, but log the error
                }
              }
              
              // Track usage for analytics (optional in credit-only system)
              try {
                // Usage tracking is now optional - mainly for analytics
                // No subscription needed in credit-only system
              } catch (usageError) {
                console.error('Usage tracking error:', usageError);
              }
              
              socket.emit('done', { fullText, generationId: generation.id });
            }
          },
          (err) => {
            if (!controller.signal.aborted) {
              console.error('AI generation error:', err);
              
              // Log failed API key usage
              if (usedApiKeyId) {
                prisma.apiKeyUsageLog.create({
                  data: {
                    apiKeyId: usedApiKeyId,
                    provider: selectedProvider,
                    userId,
                    promptId,
                    useCase,
                    success: false,
                    errorMsg: err.message || 'Generation failed',
                  },
                }).catch(logErr => console.error('Failed to log API key failure:', logErr.message));
              }
              
              socket.emit('error', { error: err.message || 'Generation failed' });
            }
          },
          controller.signal,
          null,  // model (null = auto-select based on useCase)
          useCase,  // useCase for intelligent model selection
          (keyId) => { usedApiKeyId = keyId; } // Callback to capture which key was used
        );
      } catch (err) {
        console.error('Socket generate-stream error:', err);
        if (!activeGenerations.get(socket.id)?.signal.aborted) {
          socket.emit('error', { error: err.message || 'An error occurred during generation' });
        }
      } finally {
        activeGenerations.delete(socket.id);
      }
    });

    socket.on('cancel-generation', () => {
      const controller = activeGenerations.get(socket.id);
      if (controller) {
        controller.abort();
        activeGenerations.delete(socket.id);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${userId})`);
      const controller = activeGenerations.get(socket.id);
      if (controller) {
        controller.abort();
        activeGenerations.delete(socket.id);
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });
}
