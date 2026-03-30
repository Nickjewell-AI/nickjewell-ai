// Cloudflare Pages Function — /d1-read
// GET-based read-only D1 queries for external tools

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequest(context) {
  if (context.request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const url = new URL(context.request.url);
  const adminKey = url.searchParams.get('admin_key');

  if (!adminKey || adminKey !== context.env.ADMIN_KEY) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const sql = url.searchParams.get('sql');

    if (!sql || typeof sql !== 'string') {
      return jsonResponse({ success: false, error: 'Missing or invalid sql parameter' }, 400);
    }

    const trimmed = sql.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('PRAGMA')) {
      return jsonResponse({ success: false, error: 'Only SELECT and PRAGMA queries are allowed' }, 403);
    }

    let bindParams = [];
    const paramsRaw = url.searchParams.get('params');
    if (paramsRaw) {
      try {
        bindParams = JSON.parse(paramsRaw);
        if (!Array.isArray(bindParams)) bindParams = [];
      } catch {
        return jsonResponse({ success: false, error: 'Invalid params JSON' }, 400);
      }
    }

    const result = await context.env.DB.prepare(sql).bind(...bindParams).all();

    return jsonResponse({
      success: true,
      results: result.results,
      meta: { rows: result.results.length },
    }, 200);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || 'Query failed' }, 500);
  }
}
