import { getAllApiKeys, markKeySuccess, markKeyFailure } from '../apiKeyService.js';

export const anthropicProvider = {
  name: 'anthropic',
  async streamComplete(prompt, onToken, onDone, onError, signal, model = null, useCase = null, onKeySelected = null) {
    const apiKeys = await getAllApiKeys('anthropic');
    if (apiKeys.length === 0) {
      return onError(new Error('Anthropic API key not configured on server'));
    }

    let lastError = null;

    // Try each available API key
    for (const { key: apiKey, id: keyId } of apiKeys) {
      try {
        // Notify which key is being used
        if (onKeySelected) onKeySelected(keyId);
        
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 4096, messages: [{ role: 'user', content: prompt }], stream: true }),
          signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          if (signal?.aborted) return;
          
          // Check if it's an auth error (invalid key)
          if (res.status === 401 || res.status === 403) {
            await markKeyFailure(keyId, { code: res.status, message: `Anthropic returned ${res.status}: ${text}` });
            lastError = new Error(`Anthropic returned ${res.status}: ${text}`);
            continue; // Try next key
          }
          
          // For other errors, don't mark as failure and return immediately
          return onError(new Error(`Anthropic returned ${res.status}: ${text}`));
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
            if (!cleaned) continue;
            try {
              const json = JSON.parse(cleaned);
              if (json.type === 'content_block_delta' && json.delta?.text) onToken(json.delta.text);
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
    onError(lastError || new Error('All Anthropic API keys failed'));
  },
};
