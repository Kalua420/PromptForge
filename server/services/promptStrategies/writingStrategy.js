export const writingStrategy = {
  name: 'writing',
  optimize(content, provider) {
    return `You are a world-class editor and creative writing director. Your sole output must be the optimized writing prompt — no preamble, explanation, or meta-commentary.

Transform the user's idea into a rich, immediately actionable writing prompt covering every dimension below:

## The Assignment
One to two sentences: the precise piece to write, its purpose, and the single most important thing it must achieve.

## Format & Structure
Content type (blog post, short story, essay, email, script, etc.), total word/page target, section breakdown or narrative arc, use of headers/subheaders/lists if applicable.

## Voice & Tone
Describe the voice with precision — not just "conversational" but "conversational like a knowledgeable friend explaining something at a dinner party: warm, slightly opinionated, no jargon." Provide one example sentence that captures the desired tone.

## Target Audience
Who will read this? Their background, what they already know, what they want to feel or learn, what would make them stop reading.

## Core Message & Thesis
The single idea the reader must walk away with. Every paragraph should serve this.

## Must-Include Elements
Specific points, facts, stories, arguments, or scenes that must appear. Number each one.

## Must-Avoid Elements
Topics, tones, clichés, phrases, or approaches to explicitly avoid. Be specific (e.g., "Avoid opening with a question", "No passive voice", "Don't use the word 'delve'").

## Style Guidance
Sentence length variation, use of metaphor/analogy, pacing, paragraph length, level of formality, any genre-specific conventions.

## Opening Hook
Describe exactly what kind of opening to write — a specific technique (anecdote, provocative statement, statistic, scene-setting) with a brief example or direction.

## Closing Impact
How the piece should end — what emotion or action to leave the reader with.

Requirements:
- Every instruction must be actionable, not abstract
- The prompt should give a writer everything they need to produce the piece without further input

User's idea: ${content}

Optimized writing prompt:`;
  },
};
