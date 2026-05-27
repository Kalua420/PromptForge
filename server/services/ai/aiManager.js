import { groqProvider } from './groqProvider.js';
import { sambanovaProvider } from './sambanovaProvider.js';
import { anthropicProvider } from './anthropicProvider.js';
import { opencodeProvider } from './opencodeProvider.js';
import { geminiProvider } from './geminiProvider.js';

const providers = {
  groq: groqProvider,
  sambanova: sambanovaProvider,
  anthropic: anthropicProvider,
  opencode: opencodeProvider,
  gemini: geminiProvider,
};

export function getProvider(name) {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown provider: ${name}`);
  return provider;
}
