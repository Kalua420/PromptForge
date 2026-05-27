/**
 * refineService.js
 * Generates contextual clarifying questions to help users refine their prompts
 * before the main generation step.
 */

// ─── Fallback questions (used when AI question generation fails) ──────────────
// These are deliberately richer than the originals — more options, more specific.

const fallbackQuestions = {
  chatbot: [
    {
      id: 'tone',
      text: 'What tone should the chatbot use?',
      options: ['Friendly & casual', 'Professional & formal', 'Witty & humorous', 'Empathetic & supportive', 'Direct & efficient'],
    },
    {
      id: 'response_length',
      text: 'How detailed should responses typically be?',
      options: ['Very concise (1–2 sentences)', 'Short & focused', 'Balanced', 'Thorough & detailed', 'Varies by question complexity'],
    },
    {
      id: 'domain',
      text: 'What is the chatbot\'s primary knowledge domain?',
      options: ['Customer support', 'Sales & lead generation', 'Internal HR / IT helpdesk', 'Education & tutoring', 'General-purpose assistant'],
    },
    {
      id: 'escalation',
      text: 'How should it handle topics outside its expertise?',
      options: ['Politely decline and redirect', 'Escalate to a human agent', 'Give a best-effort answer with a disclaimer', 'Ask a clarifying question first'],
    },
  ],

  coding: [
    {
      id: 'language',
      text: 'Which programming language or stack?',
      options: ['JavaScript / TypeScript', 'Python', 'Java / Kotlin', 'Go', 'Rust', 'C# / .NET'],
    },
    {
      id: 'paradigm',
      text: 'What coding style or architecture?',
      options: ['Functional', 'Object-oriented', 'Event-driven', 'Clean Architecture / Hexagonal', 'Procedural / scripting'],
    },
    {
      id: 'scope',
      text: 'What is the scope of the deliverable?',
      options: ['Single function or utility', 'Module / service', 'Full feature with tests', 'Production-ready with error handling & docs', 'Prototype / proof-of-concept'],
    },
    {
      id: 'testing',
      text: 'What level of testing is required?',
      options: ['None — just working code', 'Happy path only', 'Unit tests for core logic', 'Full test suite with edge cases', 'TDD — tests first'],
    },
  ],

  writing: [
    {
      id: 'tone',
      text: 'What tone should the writing have?',
      options: ['Professional & authoritative', 'Conversational & approachable', 'Persuasive & compelling', 'Academic & analytical', 'Storytelling & narrative'],
    },
    {
      id: 'audience',
      text: 'Who is the target audience?',
      options: ['General public', 'Industry professionals', 'C-suite / executives', 'Students / beginners', 'Technical experts'],
    },
    {
      id: 'length',
      text: 'What is the target length?',
      options: ['Under 300 words (short-form)', '300–800 words (article)', '800–1500 words (long-form)', '1500–3000 words (deep dive)', '3000+ words (guide / whitepaper)'],
    },
    {
      id: 'goal',
      text: 'What should the reader do or feel after reading?',
      options: ['Informed & educated', 'Persuaded to take action', 'Entertained', 'Emotionally moved', 'Ready to make a purchase decision'],
    },
  ],

  research: [
    {
      id: 'depth',
      text: 'How deep should the analysis go?',
      options: ['Quick executive summary', 'Structured overview with key points', 'Moderate depth with evidence', 'Comprehensive with citations', 'Academic-level exhaustive analysis'],
    },
    {
      id: 'format',
      text: 'How should findings be structured?',
      options: ['Bullet-point summary', 'Full report with sections', 'Compare & contrast table', 'Pros/cons analysis', 'Narrative with recommendations'],
    },
    {
      id: 'perspective',
      text: 'Which perspective should the research emphasise?',
      options: ['Neutral & balanced', 'Business / commercial lens', 'Academic / theoretical lens', 'Policy & regulatory lens', 'Consumer / end-user lens'],
    },
    {
      id: 'output',
      text: 'What is the primary output?',
      options: ['Understanding a topic', 'Making a decision', 'Writing a report', 'Preparing a presentation', 'Fact-checking a claim'],
    },
  ],

  image: [
    {
      id: 'style',
      text: 'What visual style or medium?',
      options: ['Photorealistic / photography', 'Digital painting', 'Oil or watercolour painting', 'Anime / manga', 'Minimalist / flat design', '3D render / CGI'],
    },
    {
      id: 'mood',
      text: 'What mood or atmosphere?',
      options: ['Bright, energetic & uplifting', 'Dark, moody & cinematic', 'Serene & peaceful', 'Dramatic & intense', 'Surreal & dreamlike', 'Cosy & warm'],
    },
    {
      id: 'composition',
      text: 'What kind of shot or framing?',
      options: ['Portrait / close-up', 'Full scene / wide shot', 'Aerial / bird\'s eye', 'Macro / extreme detail', 'Cinematic widescreen'],
    },
    {
      id: 'platform',
      text: 'Which image generation platform?',
      options: ['Midjourney', 'DALL-E 3', 'Stable Diffusion', 'Flux', 'Adobe Firefly'],
    },
  ],

  video: [
    {
      id: 'format',
      text: 'What type of video?',
      options: ['Tutorial / how-to', 'Explainer / educational', 'Story / narrative', 'Product demo', 'Short-form social (< 60s)'],
    },
    {
      id: 'style',
      text: 'What visual style?',
      options: ['Live action', 'Screen recording', '2D animation', '3D animation', 'Talking head with B-roll'],
    },
    {
      id: 'platform',
      text: 'Where will this video be published?',
      options: ['YouTube (long-form)', 'YouTube Shorts / TikTok / Reels', 'LinkedIn', 'Internal training / LMS', 'Website / landing page'],
    },
    {
      id: 'tone',
      text: 'What is the tone?',
      options: ['Professional & corporate', 'Casual & friendly', 'High-energy & entertaining', 'Authoritative & expert', 'Storytelling & emotional'],
    },
  ],
};

// ─── AI-powered question generation ──────────────────────────────────────────

const QUESTION_SYSTEM_PROMPT = `You are a prompt refinement specialist. Analyse the user's draft prompt and its use case, then generate exactly 4 clarifying questions that will most improve the final output.

Critical rules:
- Questions must be SPECIFIC to what the user actually wrote. Reference their content explicitly.
- If they mention a specific technology, audience, brand, or concept — ask about IT, not a generic version.
- Each question must have 4–6 concrete, mutually exclusive answer options.
- Options must be practical choices a user can pick without thinking hard — not vague placeholders.
- Prioritise questions about: the most ambiguous aspect, the highest-impact decision, and missing context that would significantly change the output.
- Order questions from most to least impactful.
- Keep question text under 12 words.

Return ONLY a valid JSON array — no markdown fences, no preamble:
[
  { "id": "short_slug", "text": "Question text?", "options": ["Option A", "Option B", "Option C", "Option D"] }
]`;

async function callAiForQuestions(content, useCase, provider = 'groq') {
  const envKeys = {
    groq: process.env.GROQ_API_KEY,
    sambanova: process.env.SAMBANOVA_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    opencode: process.env.OPENCODE_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };

  // Provider priority: prefer fast/cheap providers for question generation
  const providerOrder = [provider, 'groq', 'sambanova', 'anthropic'].filter(
    (p, i, arr) => arr.indexOf(p) === i // deduplicate
  );

  for (const p of providerOrder) {
    const apiKey = envKeys[p];
    if (!apiKey) continue;

    try {
      const result = await _callProvider(p, apiKey, content, useCase);
      if (result) return result;
    } catch {
      // Try next provider
      continue;
    }
  }

  return null;
}

async function _callProvider(provider, apiKey, content, useCase) {
  const endpoints = {
    groq: { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
    sambanova: { url: 'https://api.sambanova.ai/v1/chat/completions', model: 'DeepSeek-V3.1' },
    anthropic: { url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-5-haiku-20241022' },
    opencode: { url: 'https://opencode.ai/zen/v1/chat/completions', model: 'opencode/deepseek-v4-flash-free' },
    gemini: { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, model: 'gemini-2.0-flash' },
  };

  const ep = endpoints[provider];
  if (!ep) return null;

  const userPrompt = `Use case: ${useCase}\n\nUser's draft prompt:\n${content}`;

  const headers = { 'Content-Type': 'application/json' };
  let body;

  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    body = {
      model: ep.model,
      max_tokens: 1024,
      system: QUESTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    };
  } else if (provider === 'gemini') {
    body = {
      contents: [{ parts: [{ text: `${QUESTION_SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
    };
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
    body = {
      model: ep.model,
      messages: [
        { role: 'system', content: QUESTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    };
  }

  const res = await fetch(ep.url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) return null;

  const json = await res.json();
  let text;

  if (provider === 'anthropic') {
    text = json.content?.[0]?.text;
  } else if (provider === 'gemini') {
    text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  } else {
    text = json.choices?.[0]?.message?.content;
  }

  if (!text) return null;

  // Strip markdown fences if model ignored instructions
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  // Unwrap if wrapped in an object
  if (!Array.isArray(parsed)) {
    const firstArrayValue = Object.values(parsed).find(Array.isArray);
    if (firstArrayValue) parsed = firstArrayValue;
    else return null;
  }

  if (parsed.length === 0) return null;

  return parsed.slice(0, 5).map((q, i) => ({
    id: q.id || `q${i}`,
    text: q.text || '',
    options: Array.isArray(q.options) ? q.options.slice(0, 6) : [],
  })).filter(q => q.text && q.options.length >= 2);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate clarifying questions for prompt refinement.
 * Tries AI-powered generation first, falls back to curated static questions.
 *
 * @param {string} useCase - The prompt use case
 * @param {string} content - The user's draft prompt
 * @param {string} [provider] - Preferred AI provider for question generation
 * @returns {Promise<Array<{id: string, text: string, options: string[]}>>}
 */
export async function generateQuestions(useCase, content, provider) {
  // Only attempt AI generation if content is substantial enough to be specific about
  if (content && content.trim().length >= 20) {
    const ai = await callAiForQuestions(content, useCase, provider);
    if (ai && ai.length > 0) return ai;
  }

  // Fall back to curated questions for this use case
  const specific = fallbackQuestions[useCase] || [];
  return specific;
}
