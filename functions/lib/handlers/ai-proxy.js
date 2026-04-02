// Handler for Anthropic API proxy — assessment and brief types

import { checkIpLimit, checkBriefCap } from '../middleware/rate-limit.js';
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

  // Admin bypass for rate limiting
  const url = new URL(request.url);
  const adminKey = url.searchParams.get('admin_key');
  const isAdmin = adminKey && env.ADMIN_KEY && adminKey === env.ADMIN_KEY;

  // For briefs, enforce per-IP limit first, then the global daily cap
  // If D1 is unavailable or errors, skip rate limiting and proceed to Anthropic
  if (type === 'brief' && env.DB && !isAdmin) {
    const clientIp = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

    try {
      const ipResponse = await checkIpLimit(env.DB, clientIp);
      if (ipResponse) return ipResponse;
    } catch (err) {
      console.error('D1 per-IP rate limit check failed:', err.message);
    }

    try {
      const capResponse = await checkBriefCap(env.DB);
      if (capResponse) return capResponse;
    } catch (err) {
      console.error('D1 global daily cap check failed:', err.message);
    }
  }

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
