/**
 * SambaNova Provider
 * Supports all SambaNova models via their OpenAI-compatible API
 * Intelligently selects the best model based on task category
 * Available models: DeepSeek-V3.1, DeepSeek-V3.2, Llama-4-Maverick-17B-128E-Instruct, Meta-Llama-3.3-70B-Instruct, MiniMax-M2.7, gamma-3-12b-it, gpt-oss-120b
 */

import { getAllApiKeys, markKeySuccess, markKeyFailure } from '../apiKeyService.js';

// Map of available SambaNova models
const SAMBANOVA_MODELS = {
  'deepseek-v3.1': 'DeepSeek-V3.1',
  'deepseek-v3.2': 'DeepSeek-V3.2',
  'llama-4-maverick': 'Llama-4-Maverick-17B-128E-Instruct',
  'meta-llama-3.3-70b': 'Meta-Llama-3.3-70B-Instruct',
  'minimax-m2.7': 'MiniMax-M2.7',
  'gamma-3-12b': 'gamma-3-12b-it',
  'gpt-oss-120b': 'gpt-oss-120b',
};

// Default model to use (best performance/cost balance)
const DEFAULT_MODEL = 'DeepSeek-V3.1';

/**
 * Model selection strategy based on use case
 * Optimizes for speed, quality, and cost based on task requirements
 */
const MODEL_SELECTION_STRATEGY = {
  // Coding: Needs precision, instruction-following, and code understanding
  coding: {
    primary: 'Llama-4-Maverick-17B-128E-Instruct',    // Best for code generation
    secondary: 'DeepSeek-V3.1',                        // Fallback: balanced
    tertiary: 'Meta-Llama-3.3-70B-Instruct',          // For complex algorithms
    reason: 'Llama-4-Maverick excels at instruction-following and code generation'
  },

  // Writing: Needs creativity, fluency, and style consistency
  writing: {
    primary: 'DeepSeek-V3.1',                          // Best balance for writing
    secondary: 'Meta-Llama-3.3-70B-Instruct',         // For complex narratives
    tertiary: 'DeepSeek-V3.2',                         // Latest variant
    reason: 'DeepSeek-V3.1 provides excellent writing quality with good speed'
  },

  // Chatbot: Needs conversational ability, context understanding, and quick responses
  chatbot: {
    primary: 'DeepSeek-V3.1',                          // Best for conversations
    secondary: 'gamma-3-12b-it',                       // Fast responses
    tertiary: 'Llama-4-Maverick-17B-128E-Instruct',   // Better context
    reason: 'DeepSeek-V3.1 excels at natural conversation'
  },

  // Research: Needs deep reasoning, comprehensive analysis, and accuracy
  research: {
    primary: 'Meta-Llama-3.3-70B-Instruct',           // Most powerful for analysis
    secondary: 'gpt-oss-120b',                         // Excellent reasoning
    tertiary: 'DeepSeek-V3.1',                         // Balanced fallback
    reason: 'Meta-Llama-3.3-70B provides superior reasoning for research tasks'
  },

  // Image: Needs creative description and visual understanding
  image: {
    primary: 'DeepSeek-V3.1',                          // Good for descriptions
    secondary: 'DeepSeek-V3.2',                        // Latest variant
    tertiary: 'Meta-Llama-3.3-70B-Instruct',          // For complex scenes
    reason: 'DeepSeek-V3.1 provides good creative descriptions'
  },

  // Video: Needs structured planning and creative direction
  video: {
    primary: 'DeepSeek-V3.1',                          // Good for planning
    secondary: 'Meta-Llama-3.3-70B-Instruct',         // For complex scripts
    tertiary: 'DeepSeek-V3.2',                         // Latest variant
    reason: 'DeepSeek-V3.1 excels at structured planning'
  },

  // Default fallback
  default: {
    primary: 'DeepSeek-V3.1',
    secondary: 'DeepSeek-V3.2',
    tertiary: 'Meta-Llama-3.3-70B-Instruct',
    reason: 'Balanced model for general tasks'
  }
};

// Rate limiting state
const rateLimitState = {
  lastRequestTime: 0,
  requestCount: 0,
  resetTime: 0,
  isRateLimited: false,
};

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 5, // Conservative limit
  minDelayBetweenRequests: 2000, // 2 seconds between requests
  backoffMultiplier: 2,
  maxRetries: 3,
  initialRetryDelay: 5000, // 5 seconds
};

/**
 * Wait for rate limit to clear
 */
async function waitForRateLimit() {
  const now = Date.now();
  
  // Check if we're in a rate limit cooldown
  if (rateLimitState.isRateLimited && now < rateLimitState.resetTime) {
    const waitTime = rateLimitState.resetTime - now;
    console.log(`SambaNova rate limited. Waiting ${Math.ceil(waitTime / 1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    rateLimitState.isRateLimited = false;
  }
  
  // Enforce minimum delay between requests
  const timeSinceLastRequest = now - rateLimitState.lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_CONFIG.minDelayBetweenRequests) {
    const delayNeeded = RATE_LIMIT_CONFIG.minDelayBetweenRequests - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }
  
  // Reset counter every minute
  if (now - rateLimitState.resetTime > 60000) {
    rateLimitState.requestCount = 0;
    rateLimitState.resetTime = now;
  }
  
  // Check if we're approaching the limit
  if (rateLimitState.requestCount >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    const waitUntilReset = rateLimitState.resetTime + 60000 - now;
    if (waitUntilReset > 0) {
      console.log(`SambaNova request limit reached. Waiting ${Math.ceil(waitUntilReset / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitUntilReset));
      rateLimitState.requestCount = 0;
      rateLimitState.resetTime = Date.now();
    }
  }
  
  rateLimitState.lastRequestTime = Date.now();
  rateLimitState.requestCount++;
}

/**
 * Handle 429 rate limit error
 */
function handleRateLimitError(retryAfter = 60) {
  rateLimitState.isRateLimited = true;
  rateLimitState.resetTime = Date.now() + (retryAfter * 1000);
  console.log(`SambaNova rate limit triggered. Cooldown for ${retryAfter}s`);
}

export const sambanovaProvider = {
  name: 'sambanova',
  
  /**
   * Select the best model for a given use case
   * @param {string} useCase - The task category (coding, writing, chatbot, research, image, video)
   * @returns {string} The selected model name
   */
  selectBestModel(useCase) {
    const strategy = MODEL_SELECTION_STRATEGY[useCase] || MODEL_SELECTION_STRATEGY.default;
    return strategy.primary;
  },

  /**
   * Get model selection strategy for a use case
   * @param {string} useCase - The task category
   * @returns {Object} Strategy with primary, secondary, tertiary models and reason
   */
  getModelStrategy(useCase) {
    return MODEL_SELECTION_STRATEGY[useCase] || MODEL_SELECTION_STRATEGY.default;
  },
  
  async streamComplete(prompt, onToken, onDone, onError, signal, model = null, useCase = null, onKeySelected = null) {
    const apiKeys = await getAllApiKeys('sambanova');
    if (apiKeys.length === 0) {
      return onError(new Error('SambaNova API key not configured on server'));
    }
    
    let lastError = null;

    // Try each available API key
    for (const { key: apiKey, id: keyId } of apiKeys) {
      let retryCount = 0;
      
      while (retryCount <= RATE_LIMIT_CONFIG.maxRetries) {
        try {
          // Notify which key is being used
          if (onKeySelected) onKeySelected(keyId);
          
          // Wait for rate limit clearance before making request
          await waitForRateLimit();
          
          // Select model: use provided model, or select based on useCase, or use default
          let selectedModel = model || DEFAULT_MODEL;
          
          if (!model && useCase) {
            selectedModel = this.selectBestModel(useCase);
          }
          
          const res = await fetch('https://api.sambanova.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: selectedModel,
              messages: [{ role: 'user', content: prompt }],
              stream: true,
              temperature: 0.7,
              top_p: 0.95,
              max_tokens: 4096,
            }),
            signal,
          });

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            if (signal?.aborted) return;
            
            // Check if it's an auth error (invalid key)
            if (res.status === 401 || res.status === 403) {
              await markKeyFailure(keyId, { code: res.status, message: `SambaNova returned ${res.status}: ${text}` });
              lastError = new Error(`SambaNova returned ${res.status}: ${text}`);
              break; // Try next key
            }
            
            // Handle 429 rate limit with retry
            if (res.status === 429) {
              const retryAfter = parseInt(res.headers.get('retry-after') || '60');
              handleRateLimitError(retryAfter);
              
              if (retryCount < RATE_LIMIT_CONFIG.maxRetries) {
                const retryDelay = RATE_LIMIT_CONFIG.initialRetryDelay * Math.pow(RATE_LIMIT_CONFIG.backoffMultiplier, retryCount);
                console.log(`SambaNova 429 error. Retry ${retryCount + 1}/${RATE_LIMIT_CONFIG.maxRetries} in ${retryDelay / 1000}s...`);
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue; // Retry the request
              } else {
                lastError = new Error(`SambaNova rate limit exceeded. Please try again in ${retryAfter} seconds or use a different provider (Groq or Gemini).`);
                await markKeyFailure(keyId, { code: 429, message: `Rate limit exceeded` });
                break; // Try next key
              }
            }
            
            return onError(new Error(`SambaNova returned ${res.status}: ${text}`));
          }

          // Success! Mark key as working
          await markKeySuccess(keyId);

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (signal?.aborted) {
              reader.cancel();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
              const cleaned = line.replace(/^data: /, '').trim();
              if (!cleaned || cleaned === '[DONE]') continue;

              try {
                const json = JSON.parse(cleaned);
                const token = json.choices?.[0]?.delta?.content || '';
                if (token) onToken(token);
              } catch {
                // Skip parse errors
              }
            }
          }

          onDone();
          return; // Success - exit function
          
        } catch (err) {
          if (err.name === 'AbortError') return;
          lastError = err;
          
          // Don't retry on abort
          if (signal?.aborted) {
            return;
          }
          
          // Retry on network errors
          if (retryCount < RATE_LIMIT_CONFIG.maxRetries) {
            console.log(`SambaNova request failed. Retry ${retryCount + 1}/${RATE_LIMIT_CONFIG.maxRetries}...`);
            retryCount++;
            const retryDelay = RATE_LIMIT_CONFIG.initialRetryDelay * Math.pow(RATE_LIMIT_CONFIG.backoffMultiplier, retryCount - 1);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            await markKeyFailure(keyId, { code: err.code || 'NETWORK_ERROR', message: err.message });
            break; // Try next key
          }        }
      }
    }
    
    // All keys failed
    onError(lastError || new Error('All SambaNova API keys failed'));
  },

  /**
   * Get list of available models
   */
  getAvailableModels() {
    return Object.values(SAMBANOVA_MODELS);
  },

  /**
   * Get model by key
   */
  getModel(key) {
    return SAMBANOVA_MODELS[key] || DEFAULT_MODEL;
  },

  /**
   * Get default model
   */
  getDefaultModel() {
    return DEFAULT_MODEL;
  },
};
