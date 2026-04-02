// Handler for assessment D1 operations — POST (auto-save) and PATCH (contact info)

import { dispatchWebhooks } from '../webhooks.js';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://nickjewell.ai',
};

function respond(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

// POST — auto-save all assessment data (no user action required)
export async function handleAssessmentPost(request, env, ctx) {
  try {
    const body = await request.json();

    const required = ['verdict', 'composite_score', 'taste_signature', 'all_responses'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return respond({ error: `Missing required field: ${field}` }, 400);
      }
    }

    if (!['Green', 'Amber', 'Red'].includes(body.verdict)) {
      return respond({ error: 'Invalid verdict value' }, 400);
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
      return respond({ error: 'Payload too large' }, 413);
    }

    const result = await env.DB.prepare(`
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

    // Dispatch webhook for assessment completion
    ctx.waitUntil(dispatchWebhooks(env, 'assessment_complete', {
      event: 'assessment_complete',
      assessment_id: rowId,
      timestamp: new Date().toISOString(),
      verdict,
      binding_constraint: bindingConstraint,
      industry,
      composite_score: compositeScore,
    }));

    return respond({ success: true, id: rowId }, 200);
  } catch (err) {
    return respond({ error: 'Internal server error' }, 500);
  }
}

// PATCH — update existing row with optional contact info
export async function handleAssessmentPatch(request, env, ctx) {
  try {
    const body = await request.json();

    if (!body.id || typeof body.id !== 'number') {
      return respond({ error: 'Missing or invalid id' }, 400);
    }

    const sanitize = (val, maxLen) => {
      if (val === undefined || val === null) return null;
      return String(val).trim().slice(0, maxLen) || null;
    };

    const name = sanitize(body.name, 200);
    const email = sanitize(body.email, 320);
    const company = sanitize(body.company, 200);
    const role = sanitize(body.role, 200);

    if (!name && !email && !company && !role) {
      return respond({ success: true }, 200);
    }

    await env.DB.prepare(`
      UPDATE assessment_results
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          company = COALESCE(?, company),
          role = COALESCE(?, role)
      WHERE id = ?
    `).bind(name, email, company, role, body.id).run();

    // Dispatch webhook for email capture
    if (email) {
      ctx.waitUntil(dispatchWebhooks(env, 'email_capture', {
        event: 'email_capture',
        assessment_id: body.id,
        timestamp: new Date().toISOString(),
        name,
        email,
        company,
        role,
      }));
    }

    return respond({ success: true }, 200);
  } catch (err) {
    return respond({ error: 'Internal server error' }, 500);
  }
}
