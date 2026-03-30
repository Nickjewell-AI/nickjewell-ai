// GET, POST /api/v1/drafts — agent-generated drafts

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
  const rl = await rateLimit(request, env, { maxRequests: 100, keyPrefix: 'drafts_read' });
  if (!rl.allowed) {
    return addCors(error('RATE_LIMITED', 'Rate limit exceeded. Try again later.', 429), cors.headers);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const draftType = url.searchParams.get('draft_type');
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit')) || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);

  let sql = 'SELECT * FROM agent_drafts WHERE 1=1';
  const params = [];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (draftType) { sql += ' AND draft_type = ?'; params.push(draftType); }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const result = await env.DB.prepare(sql).bind(...params).all();
    const rows = result.results || [];

    return addCors(success(rows, {
      count: rows.length, limit, offset,
      filters: { status: status || null, draft_type: draftType || null },
    }), cors.headers);
  } catch (err) {
    console.error('Drafts query error:', err.message);
    return addCors(error('INTERNAL_ERROR', 'Failed to fetch drafts', 500), cors.headers);
  }
}

async function handlePost(request, env, cors) {
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

  const { draft_type, recipient, subject, body: draftBody, confidence_score, agent_run_id, assessment_id } = body;
  const timestamp = new Date().toISOString();

  try {
    const result = await env.DB.prepare(
      'INSERT INTO agent_drafts (draft_type, recipient, subject, body, confidence_score, agent_run_id, assessment_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      draft_type || null, recipient || null, subject || null, draftBody || null,
      confidence_score ?? null, agent_run_id || null, assessment_id || null,
      'pending', timestamp, timestamp
    ).run();

    const id = result.meta?.last_row_id ?? null;

    return addCors(created({
      id, draft_type, recipient, subject, body: draftBody, confidence_score,
      agent_run_id, assessment_id, status: 'pending', created_at: timestamp, updated_at: timestamp,
    }), cors.headers);
  } catch (err) {
    console.error('Draft insert error:', err.message);
    return addCors(error('INTERNAL_ERROR', 'Failed to create draft', 500), cors.headers);
  }
}

function addCors(response, corsHeaders) {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
