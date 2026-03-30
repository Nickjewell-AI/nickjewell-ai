// GET, POST /api/v1/signals — intent signals

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
  const rl = await rateLimit(request, env, { maxRequests: 100, keyPrefix: 'signals_read' });
  if (!rl.allowed) {
    return addCors(error('RATE_LIMITED', 'Rate limit exceeded. Try again later.', 429), cors.headers);
  }

  const url = new URL(request.url);
  const since = url.searchParams.get('since');
  const channel = url.searchParams.get('channel');
  const industry = url.searchParams.get('industry');
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit')) || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);

  let sql = 'SELECT * FROM intent_signals WHERE 1=1';
  const params = [];

  if (since) { sql += ' AND timestamp >= ?'; params.push(since); }
  if (channel) { sql += ' AND channel = ?'; params.push(channel); }
  if (industry) { sql += ' AND industry = ?'; params.push(industry); }

  sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const result = await env.DB.prepare(sql).bind(...params).all();
    const rows = result.results || [];

    return addCors(success(rows, {
      count: rows.length, limit, offset,
      filters: { since: since || null, channel: channel || null, industry: industry || null },
    }), cors.headers);
  } catch (err) {
    console.error('Signals query error:', err.message);
    return addCors(error('INTERNAL_ERROR', 'Failed to fetch signals', 500), cors.headers);
  }
}

async function handlePost(request, env, cors) {
  const rl = await rateLimit(request, env, { maxRequests: 30, keyPrefix: 'signals_write' });
  if (!rl.allowed) {
    return addCors(error('RATE_LIMITED', 'Rate limit exceeded. Try again later.', 429), cors.headers);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return addCors(error('BAD_REQUEST', 'Invalid JSON body'), cors.headers);
  }

  const { contact_name, company, industry, channel, signal_type, content, assessment_id } = body;
  const timestamp = new Date().toISOString();

  try {
    const result = await env.DB.prepare(
      'INSERT INTO intent_signals (contact_name, company, industry, channel, signal_type, content, assessment_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      contact_name || null, company || null, industry || null,
      channel || null, signal_type || null, content || null,
      assessment_id || null, timestamp
    ).run();

    const id = result.meta?.last_row_id ?? null;

    return addCors(created({
      id, contact_name, company, industry, channel, signal_type, content, assessment_id, timestamp,
    }), cors.headers);
  } catch (err) {
    console.error('Signal insert error:', err.message);
    return addCors(error('INTERNAL_ERROR', 'Failed to create signal', 500), cors.headers);
  }
}

function addCors(response, corsHeaders) {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
