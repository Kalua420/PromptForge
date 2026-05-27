import { getAllApiKeys, markKeySuccess, markKeyFailure } from '../apiKeyService.js';

export const geminiProvider = {
  name: 'gemini',
  async streamComplete(prompt, onToken, onDone, onError, signal, model = null, useCase = null, onKeySelected = null) {
    const apiKeys = await getAllApiKeys('gemini');
    if (apiKeys.length === 0) {
      return onError(new Error('Gemini API key not configured on server'));
    }

    let lastError = null;

    // Try each available API key
    for (const { key: apiKey, id: keyId } of apiKeys) {
      try {
        // Notify which key is being used
        if (onKeySelected) onKeySelected(keyId);
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          if (signal?.aborted) return;
          
          // Check if it's an auth error (invalid key)
          if (res.status === 401 || res.status === 403 || res.status === 400) {
            await markKeyFailure(keyId, { code: res.status, message: `Gemini returned ${res.status}: ${text}` });
            lastError = new Error(`Gemini returned ${res.status}: ${text}`);
            continue; // Try next key
          }
          
          // For other errors, don't mark as failure and return immediately
          return onError(new Error(`Gemini returned ${res.status}: ${text}`));
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
              const token = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (token) onToken(token);
            } catch { /* skip parse errors */ }
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
    onError(lastError || new Error('All Gemini API keys failed'));
  },
};
