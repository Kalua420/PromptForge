export const chatbotStrategy = {
  name: 'chatbot',
  optimize(content, provider) {
    return `You are an expert conversation designer and AI system architect. Your sole output must be a production-ready chatbot system prompt — nothing else. No preamble, no explanation, no commentary.

Transform the user's idea into a richly detailed, directly usable system prompt. Cover every dimension below:

1. IDENTITY & PERSONA — Name, role, backstory if relevant, communication personality
2. TONE & VOICE — Precise tone descriptors with a concrete example sentence showing how it sounds
3. CORE CAPABILITIES — Specific tasks the bot excels at; what it proactively offers
4. HARD BOUNDARIES — What it will never do, say, or help with; how it redirects gracefully
5. CONVERSATION FLOW — Greeting behaviour, how it asks clarifying questions, how it handles multi-turn memory
6. RESPONSE FORMAT — Length guidance, use of lists/markdown/emojis, structured vs. conversational output
7. DOMAIN EXPERTISE — Knowledge areas, depth of expertise, how it signals uncertainty
8. EDGE CASE HANDLING — Off-topic requests, ambiguous inputs, user frustration, errors, escalation paths
9. PERSONALITY TRAITS — 3–5 defining traits expressed as observable behaviours (e.g., "curious: always asks one follow-up question")
10. CLOSING BEHAVIOUR — How it wraps up conversations, offers next steps, or hands off

Requirements:
- Write entirely in second person ("You are…", "You always…", "Never…")
- Every instruction must be actionable and specific — no vague directives like "be helpful"
- Balance positive directives with explicit constraints
- The output must be ready to paste directly into an AI system prompt field

User's idea: ${content}

Optimized chatbot system prompt:`;
  },
};
