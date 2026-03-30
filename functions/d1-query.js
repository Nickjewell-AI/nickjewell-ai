// Cloudflare Pages Function — /d1-query
// Authenticated read-only SQL queries against the D1 database

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (origin === 'https://nickjewell.ai' || origin === 'https://www.nickjewell.ai') return true;
  if (origin.startsWith('http://localhost:') || origin === 'http://localhost') return true;
  if (origin.startsWith('http://127.0.0.1:') || origin === 'http://127.0.0.1') return true;
  return false;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function onRequest(context) {
  const origin = context.request.headers.get('Origin') || '';

  if (context.request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, origin);
  }

  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ success: false, error: 'Forbidden' }, 403, origin);
  }

  // Authenticate via admin_key query param
  const url = new URL(context.request.url);
  const adminKey = url.searchParams.get('admin_key');

  if (!adminKey || adminKey !== context.env.ADMIN_KEY) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401, origin);
  }

  try {
    const body = await context.request.json();
    const { sql, params } = body;

    if (!sql || typeof sql !== 'string') {
      return jsonResponse({ success: false, error: 'Missing or invalid sql field' }, 400, origin);
    }

    // Read-only: only allow SELECT and PRAGMA
    const trimmed = sql.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('PRAGMA')) {
      return jsonResponse({ success: false, error: 'Only SELECT and PRAGMA queries are allowed' }, 403, origin);
    }

    const bindParams = Array.isArray(params) ? params : [];
    const start = Date.now();
    const result = await context.env.DB.prepare(sql).bind(...bindParams).all();
    const elapsed = Date.now() - start;

    return jsonResponse({
      success: true,
      results: result.results,
      meta: {
        rows: result.results.length,
        time: elapsed + 'ms',
      },
    }, 200, origin);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || 'Query failed' }, 500, origin);
  }
}
