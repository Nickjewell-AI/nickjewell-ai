// PATCH /api/v1/drafts/:id — update draft status

import { authenticate } from '../../../lib/auth.js';
import { handleCors } from '../../../lib/cors.js';
import { success, unauthorized, notFound, methodNotAllowed, error } from '../../../lib/response.js';
import { rateLimit } from '../../../lib/rate-limit.js';

const VALID_STATUSES = ['approved', 'rejected', 'sent'];

export async function onRequest(context) {
  const { request, env, params } = context;
  const cors = handleCors(request, env);
  if (cors instanceof Response) return cors;

  if (request.method !== 'PATCH') {
    return addCors(methodNotAllowed('PATCH'), cors.headers);
  }

  try {
    await authenticate(request, env);
  } catch {
    return addCors(unauthorized(), cors.headers);
  }

  const rl = await rateLimit(request, env, { maxRequests: 30, keyPrefix: 'drafts_write' });
  if (!rl.allowed) {
    return addCors(error('RATE_LIMITED', 'Rate limit exceeded. Try again later.', 429), cors.headers);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return addCors(error('BAD_REQUEST', 'Invalid JSON body'), cors.headers);
  }

  const { status } = body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return addCors(error('BAD_REQUEST', `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`), cors.headers);
  }

  const id = params.id;
  const timestamp = new Date().toISOString();

  try {
    // Check exists
    const existing = await env.DB.prepare('SELECT * FROM agent_drafts WHERE id = ?').bind(id).first();
    if (!existing) {
      return addCors(notFound('Draft not found'), cors.headers);
    }

    await env.DB.prepare(
      'UPDATE agent_drafts SET status = ?, updated_at = ? WHERE id = ?'
    ).bind(status, timestamp, id).run();

    return addCors(success({ ...existing, status, updated_at: timestamp }), cors.headers);
  } catch (err) {
    console.error('Draft update error:', err.message);
    return addCors(error('INTERNAL_ERROR', 'Failed to update draft', 500), cors.headers);
  }
}

function addCors(response, corsHeaders) {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
