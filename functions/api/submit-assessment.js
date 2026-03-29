// Cloudflare Pages Function — POST /api/submit-assessment
// Receives completed assessment data and writes to D1

export async function onRequestPost(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://nickjewell.ai',
  };

  try {
    const body = await context.request.json();

    // Validate required fields
    const required = ['verdict', 'composite_score', 'taste_signature', 'all_responses'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers,
        });
      }
    }

    // Validate verdict value
    if (!['Green', 'Amber', 'Red'].includes(body.verdict)) {
      return new Response(JSON.stringify({ error: 'Invalid verdict value' }), {
        status: 400,
        headers,
      });
    }

    // Sanitize optional string fields (trim, max 500 chars)
    const sanitize = (val, maxLen = 500) => {
      if (val === undefined || val === null) return null;
      return String(val).trim().slice(0, maxLen) || null;
    };

    const name = sanitize(body.name, 200);
    const email = sanitize(body.email, 320);
    const company = sanitize(body.company, 200);
    const role = sanitize(body.role, 200);
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

    // Scores can be null (not assessed)
    const foundationScore = body.foundation_score != null ? Number(body.foundation_score) : null;
    const architectureScore = body.architecture_score != null ? Number(body.architecture_score) : null;
    const accountabilityScore = body.accountability_score != null ? Number(body.accountability_score) : null;
    const cultureScore = body.culture_score != null ? Number(body.culture_score) : null;
    const tasteFrame = body.taste_frame_recognition != null ? Number(body.taste_frame_recognition) : null;
    const tasteKill = body.taste_kill_discipline != null ? Number(body.taste_kill_discipline) : null;
    const tasteEdge = body.taste_edge_case_instinct != null ? Number(body.taste_edge_case_instinct) : null;

    // Serialize all_responses as JSON string
    const allResponses = typeof body.all_responses === 'string'
      ? body.all_responses
      : JSON.stringify(body.all_responses);

    // Cap payload size (all_responses could be large)
    if (allResponses.length > 50000) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), {
        status: 413,
        headers,
      });
    }

    const stmt = context.env.DB.prepare(`
      INSERT INTO assessment_results (
        name, email, company, role, role_context,
        industry, maturity_stage,
        foundation_score, architecture_score, accountability_score, culture_score,
        taste_signature, taste_frame_recognition, taste_kill_discipline, taste_edge_case_instinct,
        verdict, composite_score, binding_constraint,
        all_responses, time_to_complete_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name, email, company, role, roleContext,
      industry, maturityStage,
      foundationScore, architectureScore, accountabilityScore, cultureScore,
      tasteSignature, tasteFrame, tasteKill, tasteEdge,
      verdict, compositeScore, bindingConstraint,
      allResponses, timeToComplete
    );

    await stmt.run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://nickjewell.ai',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
