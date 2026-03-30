// GET /api/v1/assessments/:id — single assessment by ID

import { authenticate } from '../../../lib/auth.js';
import { handleCors } from '../../../lib/cors.js';
import { success, unauthorized, notFound, methodNotAllowed, error } from '../../../lib/response.js';
import { rateLimit } from '../../../lib/rate-limit.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const cors = handleCors(request, env);
  if (cors instanceof Response) return cors;

  if (request.method !== 'GET') {
    return addCors(methodNotAllowed('GET'), cors.headers);
  }

  try {
    await authenticate(request, env);
  } catch {
    return addCors(unauthorized(), cors.headers);
  }

  const rl = await rateLimit(request, env, { maxRequests: 100, keyPrefix: 'assessment_detail' });
  if (!rl.allowed) {
    return addCors(error('RATE_LIMITED', 'Rate limit exceeded. Try again later.', 429), cors.headers);
  }

  const id = params.id;

  try {
    const row = await env.DB.prepare('SELECT * FROM assessment_results WHERE id = ?').bind(id).first();

    if (!row) {
      return addCors(notFound('Assessment not found'), cors.headers);
    }

    return addCors(success(row), cors.headers);
  } catch (err) {
    console.error('Assessment detail error:', err.message);
    return addCors(error('INTERNAL_ERROR', 'Failed to fetch assessment', 500), cors.headers);
  }
}

function addCors(response, corsHeaders) {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
