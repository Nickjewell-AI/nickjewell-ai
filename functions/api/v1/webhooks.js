// GET, POST /api/v1/webhooks — webhook registration management

import { authenticate } from '../../lib/auth.js';
import { handleCors } from '../../lib/cors.js';
import { success, created, unauthorized, methodNotAllowed, error } from '../../lib/response.js';
import { rateLimit } from '../../lib/rate-limit.js';

export async function onRequest(context) {
  const { request, env } = context;
  const cors = handleCors(request, env);
  if (cors instanceof Response) return cors;

  if (request.method !== 'GET' && request.method !== 'POST') {
    return addCors(methodNotAllowed('GET, POST'), cors.headers);
  }

  try {
    await authenticate(request, env);
  } catch {
    return addCors(unauthorized(), cors.headers);
  }

  if (request.method === 'GET') return handleGet(request, env, cors);
  if (request.method === 'POST') return handlePost(request, env, cors);
}

async function handleGet(request, env, cors) {
  const rl = await rateLimit(request, env, { maxRequests: 100, keyPrefix: 'webhooks_read' });
  if (!rl.allowed) {
    return addCors(error('RATE_LIMITED', 'Rate limit exceeded. Try again later.', 429), cors.headers);
  }

  try {
    const result = await env.DB.prepare('SELECT id, url, events, active, created_at FROM webhook_registrations ORDER BY created_at DESC').all();
    const rows = result.results || [];

    return addCors(success(rows, { count: rows.length }), cors.headers);
  } catch (err) {
    console.error('Webhooks query error:', err.message);
    return addCors(error('INTERNAL_ERROR', 'Failed to fetch webhooks', 500), cors.headers);
  }
}

async function handlePost(request, env, cors) {
  const rl = await rateLimit(request, env, { maxRequests: 10, keyPrefix: 'webhooks_write' });
  if (!rl.allowed) {
    return addCors(error('RATE_LIMITED', 'Rate limit exceeded. Try again later.', 429), cors.headers);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return addCors(error('BAD_REQUEST', 'Invalid JSON body'), cors.headers);
  }

  const { url, events } = body;
  if (!url || !events) {
    return addCors(error('BAD_REQUEST', 'Missing required fields: url, events'), cors.headers);
  }

  const secret = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const result = await env.DB.prepare(
      'INSERT INTO webhook_registrations (url, events, secret, active, created_at) VALUES (?, ?, ?, 1, ?)'
    ).bind(url, events, secret, timestamp).run();

    const id = result.meta?.last_row_id ?? null;

    return addCors(created({
      id, url, events, secret, active: 1, created_at: timestamp,
    }), cors.headers);
  } catch (err) {
    console.error('Webhook insert error:', err.message);
    return addCors(error('INTERNAL_ERROR', 'Failed to create webhook', 500), cors.headers);
  }
}

function addCors(response, corsHeaders) {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
