// Cloudflare Pages Function — /api-proxy
// Thin router: parse body, read type, delegate to handler, wrap with CORS

import { handleAiProxy } from './lib/handlers/ai-proxy.js';
import { handleSendResults, handleSendBriefEmail, handleGenerateAndEmailBrief } from './lib/handlers/email.js';
import { handleFeedback } from './lib/handlers/feedback.js';
import { isAllowedOrigin, withCors, jsonResponse, corsHeaders } from './lib/middleware/responses.js';

const HANDLERS = {
  assessment: handleAiProxy,
  brief: handleAiProxy,
  'send-results': handleSendResults,
  'send-brief-email': handleSendBriefEmail,
  'generate-and-email-brief': handleGenerateAndEmailBrief,
  submit_feedback: handleFeedback,
};

export async function onRequestPost(context) {
  const origin = context.request.headers.get('Origin') || '';

  if (!isAllowedOrigin(origin)) {
    return withCors(jsonResponse({ error: 'Forbidden' }, 403), origin);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return withCors(jsonResponse({ error: 'Invalid JSON body' }, 400), origin);
  }

  const handler = HANDLERS[body.type];
  if (!handler) {
    return withCors(jsonResponse({ error: 'Missing or invalid type field' }, 400), origin);
  }

  try {
    if (body.type === 'generate-and-email-brief') {
      console.log(`[router] passing context to handler — typeof context=${typeof context}, typeof context.waitUntil=${typeof context.waitUntil}`);
    }
    const response = await handler(context.request, context.env, context, body);
    return withCors(response, origin);
  } catch (err) {
    console.error(`Handler error [${body.type}]:`, err.message);
    return withCors(jsonResponse({ error: 'Internal server error' }, 500), origin);
  }
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(isAllowedOrigin(origin) ? origin : 'https://nickjewell.ai'),
  });
}
