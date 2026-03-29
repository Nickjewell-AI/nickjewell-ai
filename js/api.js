// js/api.js — Client-side API wrapper for the Jewell Assessment
// Sonnet 4 for mid-assessment features (Taste follow-ups, CU2 analysis)
// Opus 4.6 for executive brief generation (streaming)

(function () {
  const API_ENDPOINT = '/api-proxy';

  /**
   * Call the Anthropic API for assessment features (Taste follow-ups, CU2 analysis).
   * Returns the text response, or null on any failure (assessment falls back to deterministic mode).
   */
  async function callAssessmentAPI({ system, messages, model }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          type: 'assessment',
          model,
          max_tokens: 1500,
          system,
          messages,
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.content[0].text;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Generate an executive brief via streaming.
   * Calls onChunk(text) as each text fragment arrives.
   * Returns the full concatenated text, or { error: "capacity" } on 429, or null on failure.
   */
  async function generateExecutiveBrief({ system, messages, onChunk }) {
    // Abort if response hasn't started within 15 seconds
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let responseStarted = false;

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          type: 'brief',
          model: 'claude-opus-4-6',
          max_tokens: 3000,
          system,
          messages,
          stream: true,
        }),
      });

      // Handle 429 capacity limit
      if (response.status === 429) {
        clearTimeout(timeout);
        return { error: 'capacity' };
      }

      if (!response.ok) {
        clearTimeout(timeout);
        return null;
      }

      // Response has started — cancel the startup timeout
      responseStarted = true;
      clearTimeout(timeout);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events from the buffer
        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop();

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && eventType === 'content_block_delta') {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.delta && parsed.delta.type === 'text_delta') {
                fullText += parsed.delta.text;
                onChunk(parsed.delta.text);
              }
            } catch {
              // Skip malformed JSON lines
            }
            eventType = '';
          } else if (line === '') {
            // Empty line resets event type (SSE event boundary)
            eventType = '';
          }
        }
      }

      return fullText;
    } catch {
      return null;
    } finally {
      if (!responseStarted) clearTimeout(timeout);
    }
  }

  // Expose on window for use by other scripts
  window.AssessmentAPI = {
    callAssessmentAPI,
    generateExecutiveBrief,
  };
})();
