// Handler for Anthropic API proxy — assessment and brief types

import { jsonResponse } from '../middleware/responses.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function handleAiProxy(request, env, ctx, body) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse({
      error: 'Server configuration error: ANTHROPIC_API_KEY is not set',
    }, 500);
  }

  const { type, ...requestPayload } = body;

  // Forward to Anthropic Messages API
  let anthropicResponse;
  try {
    anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
  } catch (err) {
    return jsonResponse({ error: 'Failed to reach Anthropic API' }, 502);
  }

  // For streaming responses, pass the body through without buffering
  if (requestPayload.stream) {
    return new Response(anthropicResponse.body, {
      status: anthropicResponse.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  }

  // Non-streaming: buffer and return the full response
  const responseBody = await anthropicResponse.text();

  return new Response(responseBody, {
    status: anthropicResponse.status,
    headers: {
      'Content-Type': anthropicResponse.headers.get('Content-Type') || 'application/json',
    },
  });
}
