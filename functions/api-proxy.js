// Cloudflare Pages Function — /api-proxy
// Proxies requests to the Anthropic Messages API
// Handles two call types: "assessment" (Taste follow-ups, CU2 analysis) and "brief" (executive briefs)

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DAILY_BRIEF_CAP = 100;

const LAYER_NAMES = {
  foundation: 'Foundation',
  architecture: 'Architecture',
  accountability: 'Accountability',
  culture: 'Culture',
};

function buildResultsEmail(results) {
  const { verdict, composite, bindingConstraint, layerScores, tasteSignature, actions } = results;

  const verdictColors = {
    Green: '#4a9c6d',
    Amber: '#c8965a',
    Red: '#c75050',
  };
  const verdictColor = verdictColors[verdict] || '#c8965a';

  const layerRows = Object.entries(layerScores || {})
    .map(([key, score]) => {
      const name = LAYER_NAMES[key] || key;
      const isConstraint = key === bindingConstraint;
      const barWidth = score != null ? score : 0;
      const barColor = score >= 70 ? '#4a9c6d' : score >= 40 ? '#c8965a' : '#c75050';
      const constraintLabel = isConstraint ? ' <span style="color:#c8965a;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;">BINDING CONSTRAINT</span>' : '';
      return `
        <tr>
          <td style="padding:6px 0;color:#f0ebe3;font-size:14px;">${name}${constraintLabel}</td>
          <td style="padding:6px 0;width:60%;">
            <div style="background:#1a1a1a;border-radius:4px;height:10px;width:100%;">
              <div style="background:${barColor};height:10px;border-radius:4px;width:${barWidth}%;"></div>
            </div>
          </td>
          <td style="padding:6px 0 6px 12px;color:#9a9189;font-size:13px;white-space:nowrap;">${score != null ? score + '/100' : 'N/A'}</td>
        </tr>`;
    })
    .join('');

  const actionItems = (actions || [])
    .map((a) => `<li style="color:#f0ebe3;font-size:14px;line-height:1.6;margin-bottom:8px;">${a}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080808;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="padding-bottom:32px;">
    <p style="color:#9a9189;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin:0;">The Jewell Assessment</p>
  </td></tr>

  <!-- Verdict -->
  <tr><td style="padding-bottom:32px;text-align:center;">
    <div style="display:inline-block;background:#141414;border:1px solid ${verdictColor};border-radius:8px;padding:24px 40px;">
      <p style="color:${verdictColor};font-size:24px;font-weight:600;letter-spacing:0.05em;margin:0 0 8px;">${(verdict || '').toUpperCase()}</p>
      <p style="color:#f0ebe3;font-size:32px;font-weight:300;margin:0;">${composite}/100</p>
    </div>
  </td></tr>

  <!-- Layer Scores -->
  <tr><td style="padding-bottom:32px;">
    <p style="color:#c8965a;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Layer Scores</p>
    <table width="100%" cellpadding="0" cellspacing="0">${layerRows}</table>
  </td></tr>

  <!-- Taste Signature -->
  <tr><td style="background:#141414;border-left:3px solid #c8965a;padding:20px 24px;margin-bottom:32px;">
    <p style="color:#9a9189;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Taste Signature</p>
    <p style="color:#c8965a;font-size:18px;font-weight:600;margin:0;">${tasteSignature || 'N/A'}</p>
  </td></tr>

  <!-- Spacer -->
  <tr><td style="height:32px;"></td></tr>

  <!-- Actions -->
  ${actionItems ? `
  <tr><td style="padding-bottom:32px;">
    <p style="color:#c8965a;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Your Action Plan</p>
    <ul style="padding-left:20px;margin:0;">${actionItems}</ul>
  </td></tr>` : ''}

  <!-- Footer -->
  <tr><td style="border-top:1px solid #222019;padding-top:24px;">
    <p style="color:#7a756f;font-size:12px;margin:0;">The Jewell Assessment &mdash; nickjewell.ai</p>
    <p style="font-size: 13px; color: #9a9189; margin-top: 24px; padding-top: 16px; border-top: 1px solid #2a2a2a;">For ongoing analysis of AI implementation patterns, subscribe to <a href="https://nickjewellai.substack.com/subscribe" style="color: #c8965a; text-decoration: none;">The Binding Constraint</a>.</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

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

// Check per-IP daily limit for briefs. Returns null if under limit, or a 429 Response if at limit.
async function checkIpLimit(db, ip, origin) {
  const today = new Date().toISOString().slice(0, 10);
  const key = ip + ':' + today;

  const row = await db.prepare(
    'SELECT count FROM brief_ip_counter WHERE ip_date = ?'
  ).bind(key).first();

  const currentCount = row ? row.count : 0;

  if (currentCount >= 3) {
    return jsonResponse({
      error: 'ip_limit',
      message: "You've reached the maximum number of executive briefs for today. Try again tomorrow.",
    }, 429, origin);
  }

  await db.prepare(
    'INSERT OR REPLACE INTO brief_ip_counter (ip_date, count) VALUES (?, ?)'
  ).bind(key, currentCount + 1).run();

  return null;
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

  if (!type || (type !== 'assessment' && type !== 'brief' && type !== 'send-results')) {
    return jsonResponse({ error: 'Missing or invalid type field' }, 400, origin);
  }

  // Handle send-results: email results via Resend
  if (type === 'send-results') {
    const { email, results } = body;
    if (!email || !results) {
      return jsonResponse({ error: 'Missing email or results' }, 400, origin);
    }

    const resendKey = context.env.RESEND_API_KEY;
    if (!resendKey) {
      return jsonResponse({ error: 'Email service not configured' }, 500, origin);
    }

    const htmlBody = buildResultsEmail(results);

    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Nick Jewell <nick@nickjewell.ai>',
          to: email,
          subject: `Your Jewell Assessment Results — ${results.verdict}`,
          html: htmlBody,
        }),
      });

      if (!resendRes.ok) {
        const errText = await resendRes.text();
        console.error('Resend API error:', errText);
        return jsonResponse({ error: 'Failed to send email' }, 502, origin);
      }

      return jsonResponse({ success: true }, 200, origin);
    } catch (err) {
      console.error('Resend fetch error:', err.message);
      return jsonResponse({ error: 'Failed to send email' }, 502, origin);
    }
  }

  // Admin bypass for rate limiting
  const url = new URL(context.request.url);
  const adminKey = url.searchParams.get('admin_key');
  const isAdmin = adminKey && context.env.ADMIN_KEY && adminKey === context.env.ADMIN_KEY;

  // For briefs, enforce per-IP limit first, then the global daily cap
  // If D1 is unavailable or errors, skip rate limiting and proceed to Anthropic
  if (type === 'brief' && context.env.DB && !isAdmin) {
    const clientIp = context.request.headers.get('CF-Connecting-IP') || '0.0.0.0';

    try {
      const ipResponse = await checkIpLimit(context.env.DB, clientIp, origin);
      if (ipResponse) return ipResponse;
    } catch (err) {
      console.error('D1 per-IP rate limit check failed:', err.message);
    }

    try {
      const capResponse = await checkBriefCap(context.env.DB, origin);
      if (capResponse) return capResponse;
    } catch (err) {
      console.error('D1 global daily cap check failed:', err.message);
    }
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
