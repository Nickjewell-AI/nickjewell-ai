// Cloudflare Pages Function — /api-proxy
// Proxies requests to the Anthropic Messages API
// Handles two call types: "assessment" (Taste follow-ups, CU2 analysis) and "brief" (executive briefs)

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DAILY_BRIEF_CAP = 100;

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (origin === 'https://nickjewell.ai' || origin === 'https://www.nickjewell.ai') return true;
  // Allow localhost for dev
  if (origin.startsWith('http://localhost:') || origin === 'http://localhost') return true;
  if (origin.startsWith('http://127.0.0.1:') || origin === 'http://127.0.0.1') return true;
  return false;
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

// Check and increment the daily brief counter. Returns null if under cap, or a 429 Response if at capacity.
async function checkBriefCap(db, origin) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const row = await db.prepare(
    'SELECT count FROM brief_counter WHERE date = ?'
  ).bind(today).first();

  const currentCount = row ? row.count : 0;

  if (currentCount >= DAILY_BRIEF_CAP) {
    return jsonResponse({
      error: 'briefs_at_capacity',
      message: 'Executive briefs are at capacity today. Try again tomorrow.',
    }, 429, origin);
  }

  // Increment (or insert first row for today)
  await db.prepare(
    'INSERT OR REPLACE INTO brief_counter (date, count) VALUES (?, ?)'
  ).bind(today, currentCount + 1).run();

  return null; // Under cap, proceed
}

export async function onRequestPost(context) {
  const origin = context.request.headers.get('Origin') || '';

  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ error: 'Forbidden' }, 403, origin);
  }

  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse({
      error: 'Server configuration error: ANTHROPIC_API_KEY is not set',
    }, 500, origin);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, origin);
  }

  const { type, ...requestPayload } = body;

  if (!type || (type !== 'assessment' && type !== 'brief')) {
    return jsonResponse({ error: 'Missing or invalid type field (must be "assessment" or "brief")' }, 400, origin);
  }

  // For briefs, enforce the daily cap
  if (type === 'brief') {
    const capResponse = await checkBriefCap(context.env.DB, origin);
    if (capResponse) return capResponse;
  }

  // Forward to Anthropic Messages API
  let anthropicResponse;
  try {
    anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
  } catch (err) {
    return jsonResponse({ error: 'Failed to reach Anthropic API' }, 502, origin);
  }

  // For streaming responses, pass the body through without buffering
  if (requestPayload.stream) {
    return new Response(anthropicResponse.body, {
      status: anthropicResponse.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...corsHeaders(origin),
      },
    });
  }

  // Non-streaming: buffer and return the full response
  const responseBody = await anthropicResponse.text();

  return new Response(responseBody, {
    status: anthropicResponse.status,
    headers: {
      'Content-Type': anthropicResponse.headers.get('Content-Type') || 'application/json',
      ...corsHeaders(origin),
    },
  });
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(isAllowedOrigin(origin) ? origin : 'https://nickjewell.ai'),
  });
}
