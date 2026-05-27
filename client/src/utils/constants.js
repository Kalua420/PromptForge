/**
 * Client-side constants
 */

// UI Constants
export const TEXTAREA_LINE_HEIGHT = 20; // pixels
export const MAX_TEXTAREA_ROWS = 10;
export const MIN_TEXTAREA_ROWS = 2;

// Text truncation lengths
export const TITLE_PREVIEW_LENGTH = 60; // characters
export const PROMPT_PREVIEW_LENGTH = 80; // characters
export const DESCRIPTION_PREVIEW_LENGTH = 100; // characters

// Validation
export const MIN_PROMPT_LENGTH = 20; // characters
export const MAX_PROMPT_LENGTH = 50000; // characters
export const MAX_TITLE_LENGTH = 100; // characters

// API
export const USE_CASES = ['chatbot', 'coding', 'writing', 'research', 'image', 'video'];
export const PROVIDERS = ['groq', 'sambanova', 'anthropic', 'opencode', 'gemini'];

// Credit costs per provider (must match server-side config/tiers.js)
export const CREDIT_COSTS = {
  groq: 1,
  sambanova: 2,
  anthropic: 3,
  gemini: 2,
  opencode: 1,
};

// Date formatting
export const DATE_FORMAT_OPTIONS = {
  short: { month: 'short', day: 'numeric' },
  long: { year: 'numeric', month: 'long', day: 'numeric' },
  full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
};
