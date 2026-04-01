// GET /api/v1/assessments — list assessment records

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

  const rl = await rateLimit(request, env, { maxRequests: 100, keyPrefix: 'assessments_read' });
  if (!rl.allowed) {
    return addCors(error('RATE_LIMITED', 'Rate limit exceeded. Try again later.', 429), cors.headers);
  }

  const url = new URL(request.url);
  const since = url.searchParams.get('since');
  const industry = url.searchParams.get('industry');
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit')) || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);
  const sort = url.searchParams.get('sort') === 'asc' ? 'ASC' : 'DESC';

  let sql = 'SELECT * FROM assessment_results WHERE 1=1';
  const params = [];

  if (since) {
    sql += ' AND timestamp >= ?';
    params.push(since);
  }
  if (industry) {
    sql += ' AND industry = ?';
    params.push(industry);
  }

  sql += ` ORDER BY id ${sort} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  try {
    const result = await env.DB.prepare(sql).bind(...params).all();
    const rows = result.results || [];

    return addCors(success(rows, {
      count: rows.length,
      limit,
      offset,
      filters: { since: since || null, industry: industry || null },
    }), cors.headers);
  } catch (err) {
    console.error('Assessments query error:', err.message);
    return addCors(error('INTERNAL_ERROR', 'Failed to fetch assessments', 500), cors.headers);
  }
}

function addCors(response, corsHeaders) {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
