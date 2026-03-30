// GET /api/v1/feedback — list feedback records

import { authenticate } from '../../lib/auth.js';
import { handleCors } from '../../lib/cors.js';
import { success, unauthorized, methodNotAllowed, error } from '../../lib/response.js';
import { rateLimit } from '../../lib/rate-limit.js';

export async function onRequest(context) {
  const { request, env } = context;
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

  const rl = await rateLimit(request, env, { maxRequests: 100, keyPrefix: 'feedback_read' });
  if (!rl.allowed) {
    return addCors(error('RATE_LIMITED', 'Rate limit exceeded. Try again later.', 429), cors.headers);
  }

  const url = new URL(request.url);
  const since = url.searchParams.get('since');
  const sentiment = url.searchParams.get('sentiment');
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit')) || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);

  let sql = 'SELECT * FROM assessment_feedback WHERE 1=1';
  const params = [];

  if (since) {
    sql += ' AND timestamp >= ?';
    params.push(since);
  }
  if (sentiment) {
    sql += ' AND sentiment = ?';
    params.push(sentiment);
  }

  sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const result = await env.DB.prepare(sql).bind(...params).all();
    const rows = result.results || [];

    return addCors(success(rows, {
      count: rows.length,
      limit,
      offset,
      filters: { since: since || null, sentiment: sentiment || null },
    }), cors.headers);
  } catch (err) {
    console.error('Feedback query error:', err.message);
    return addCors(error('INTERNAL_ERROR', 'Failed to fetch feedback', 500), cors.headers);
  }
}

function addCors(response, corsHeaders) {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
