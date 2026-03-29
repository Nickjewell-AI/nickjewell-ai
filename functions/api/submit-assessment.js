// Cloudflare Pages Function — /api/submit-assessment
// POST: auto-saves anonymous assessment results, returns row id
// PATCH: updates an existing row with optional contact info

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://nickjewell.ai',
};

// POST — auto-save all assessment data (no user action required)
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // Validate required fields
    const required = ['verdict', 'composite_score', 'taste_signature', 'all_responses'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: CORS_HEADERS,
        });
      }
    }

    if (!['Green', 'Amber', 'Red'].includes(body.verdict)) {
      return new Response(JSON.stringify({ error: 'Invalid verdict value' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const sanitize = (val, maxLen = 500) => {
      if (val === undefined || val === null) return null;
      return String(val).trim().slice(0, maxLen) || null;
    };

    const roleContext = sanitize(body.role_context, 10);
    const industry = sanitize(body.industry, 10);
    const maturityStage = sanitize(body.maturity_stage, 10);
    const tasteSignature = sanitize(body.taste_signature, 50);
    const verdict = body.verdict;
    const compositeScore = Number(body.composite_score) || 0;
    const bindingConstraint = sanitize(body.binding_constraint, 50);
    const timeToComplete = body.time_to_complete_seconds != null
      ? Math.round(Number(body.time_to_complete_seconds))
      : null;

    const foundationScore = body.foundation_score != null ? Number(body.foundation_score) : null;
    const architectureScore = body.architecture_score != null ? Number(body.architecture_score) : null;
    const accountabilityScore = body.accountability_score != null ? Number(body.accountability_score) : null;
    const cultureScore = body.culture_score != null ? Number(body.culture_score) : null;
    const tasteFrame = body.taste_frame_recognition != null ? Number(body.taste_frame_recognition) : null;
    const tasteKill = body.taste_kill_discipline != null ? Number(body.taste_kill_discipline) : null;
    const tasteEdge = body.taste_edge_case_instinct != null ? Number(body.taste_edge_case_instinct) : null;

    const allResponses = typeof body.all_responses === 'string'
      ? body.all_responses
      : JSON.stringify(body.all_responses);

    if (allResponses.length > 50000) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), {
        status: 413,
        headers: CORS_HEADERS,
      });
    }

    const result = await context.env.DB.prepare(`
      INSERT INTO assessment_results (
        role_context, industry, maturity_stage,
        foundation_score, architecture_score, accountability_score, culture_score,
        taste_signature, taste_frame_recognition, taste_kill_discipline, taste_edge_case_instinct,
        verdict, composite_score, binding_constraint,
        all_responses, time_to_complete_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      roleContext, industry, maturityStage,
      foundationScore, architectureScore, accountabilityScore, cultureScore,
      tasteSignature, tasteFrame, tasteKill, tasteEdge,
      verdict, compositeScore, bindingConstraint,
      allResponses, timeToComplete
    ).run();

    const rowId = result.meta?.last_row_id ?? null;

    return new Response(JSON.stringify({ success: true, id: rowId }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

// PATCH — update existing row with optional contact info
export async function onRequestPatch(context) {
  try {
    const body = await context.request.json();

    if (!body.id || typeof body.id !== 'number') {
      return new Response(JSON.stringify({ error: 'Missing or invalid id' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const sanitize = (val, maxLen) => {
      if (val === undefined || val === null) return null;
      return String(val).trim().slice(0, maxLen) || null;
    };

    const name = sanitize(body.name, 200);
    const email = sanitize(body.email, 320);
    const company = sanitize(body.company, 200);

    // Only update if at least one field provided
    if (!name && !email && !company) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    await context.env.DB.prepare(`
      UPDATE assessment_results
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          company = COALESCE(?, company)
      WHERE id = ?
    `).bind(name, email, company, body.id).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://nickjewell.ai',
      'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
