import { imageStrategy } from './promptStrategies/imageStrategy.js';
import { codingStrategy } from './promptStrategies/codingStrategy.js';
import { writingStrategy } from './promptStrategies/writingStrategy.js';
import { chatbotStrategy } from './promptStrategies/chatbotStrategy.js';
import { researchStrategy } from './promptStrategies/researchStrategy.js';
import { videoStrategy } from './promptStrategies/videoStrategy.js';

const strategies = {
  image: imageStrategy,
  coding: codingStrategy,
  writing: writingStrategy,
  chatbot: chatbotStrategy,
  research: researchStrategy,
  video: videoStrategy,
};

/**
 * Provider-specific tuning hints injected at the end of meta-prompts.
 * These nudge the optimizing model toward the strengths/conventions of the
 * AI that will ultimately consume the generated prompt.
 */
const PROVIDER_HINTS = {
  anthropic: 'Optimise for Claude: use clear XML-style structure where helpful, favour direct imperative instructions, and leverage Claude\'s strength with long-context reasoning.',
  sambanova: 'Optimise for SambaNova: use clear, structured instructions with explicit formatting, leverage the model\'s strong reasoning capabilities, and include concrete examples.',
  gemini: 'Optimise for Gemini: use clear step-by-step instructions, prefer concrete examples, and leverage its strong multimodal reasoning.',
  groq: 'Optimise for fast inference: keep the prompt concise and direct without sacrificing specificity.',
  opencode: 'Optimise for code-focused LLMs: emphasise technical precision, include type information, and use code-block formatting conventions.',
};

/**
 * Core prompt engine: selects the right strategy and builds the meta-prompt
 * that will be sent to an AI to generate the user's final prompt.
 *
 * @param {string} useCase - One of: image, coding, writing, chatbot, research, video
 * @param {string} content - The user's raw idea/description
 * @param {string} [provider] - Target AI provider for the generated prompt
 * @returns {string} The assembled meta-prompt ready to send to the AI
 */
export async function promptEngine(useCase, content, provider) {
  const strategy = strategies[useCase];
  if (!strategy) throw new Error(`Unsupported use case: ${useCase}. Valid options: ${Object.keys(strategies).join(', ')}`);

  if (!content || typeof content !== 'string') throw new Error('Content must be a non-empty string');
  const trimmed = content.trim();
  if (trimmed.length === 0) throw new Error('Content cannot be empty');

  const basePrompt = strategy.optimize(trimmed, provider);

  // Append provider-specific optimisation hint when we know the target model
  const hint = provider && PROVIDER_HINTS[provider];
  if (hint) {
    return `${basePrompt}\n\n[Provider guidance: ${hint}]`;
  }

  return basePrompt;
}

/**
 * Returns the list of supported use cases.
 * @returns {string[]}
 */
export function getSupportedUseCases() {
  return Object.keys(strategies);
}
