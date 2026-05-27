import { getAllApiKeys, markKeySuccess, markKeyFailure } from '../apiKeyService.js';

let cachedModel = null;

async function findModel(apiKey) {
  if (cachedModel) return cachedModel;
  try {
    const res = await fetch('https://opencode.ai/zen/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      const models = data.data || data;
      if (Array.isArray(models) && models.length > 0) {
        cachedModel = models[0].id || models[0];
      }
    }
  } catch { /* fall back to default */ }
  return cachedModel || 'opencode/deepseek-v4-flash-free';
}

export const opencodeProvider = {
  name: 'opencode',
  async streamComplete(prompt, onToken, onDone, onError, signal, model = null, useCase = null, onKeySelected = null) {
    const apiKeys = await getAllApiKeys('opencode');
    if (apiKeys.length === 0) {
      return onError(new Error('OpenCode API key not configured on server'));
    }

    let lastError = null;

    // Try each available API key
    for (const { key: apiKey, id: keyId } of apiKeys) {
      try {
        // Notify which key is being used
        if (onKeySelected) onKeySelected(keyId);
        
        const model = await findModel(apiKey);
        const res = await fetch('https://opencode.ai/zen/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], stream: true }),
          signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          if (signal?.aborted) return;
          
          // Check if it's an auth error (invalid key)
          if (res.status === 401 || res.status === 403) {
            await markKeyFailure(keyId, { code: res.status, message: `OpenCode returned ${res.status}: ${text}` });
            lastError = new Error(`OpenCode returned ${res.status}: ${text}`);
            continue; // Try next key
          }
          
          // For other errors, don't mark as failure and return immediately
          return onError(new Error(`OpenCode returned ${res.status}: ${text}`));
        }

        // Success! Mark key as working
        await markKeySuccess(keyId);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (signal?.aborted) { reader.cancel(); return; }
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
            } catch { /* skip */ }
          }
        }
        onDone();
        return; // Success, exit function
      } catch (err) {
        if (err.name === 'AbortError') return;
        lastError = err;
        await markKeyFailure(keyId, { code: err.code || 'NETWORK_ERROR', message: err.message });
        // Continue to next key
      }
    }

    // All keys failed
    onError(lastError || new Error('All OpenCode API keys failed'));
  },
};
