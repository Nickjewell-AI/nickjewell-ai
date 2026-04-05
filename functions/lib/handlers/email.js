// Handlers for email operations — send-results, send-brief-email, generate-and-email-brief

import { buildBriefEmail } from '../email-templates.js';
import { jsonResponse } from '../middleware/responses.js';

// Shared email sender — all handlers use this. TEST_MODE skips Resend entirely.
// Returns { ok: true, id: string|null } on success, or { ok: false, error: string } on failure.
async function sendEmail(env, payload) {
  const isTestMode = env.TEST_MODE === 'true' || env.TEST_MODE === true;

  if (isTestMode) {
    console.log('TEST_MODE: skipping Resend, mock email to', payload.to);
    return { ok: true, id: 'test_mock_' + Date.now(), testMock: true };
  }

  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) {
    return { ok: false, error: 'RESEND_API_KEY not set' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: `Resend API ${res.status}: ${errText}` };
  }

  let resendId = null;
  try { resendId = (await res.json()).id || null; } catch {}
  return { ok: true, id: resendId };
}

const LAYER_NAMES = {
  foundation: 'Foundation',
  architecture: 'Architecture',
  accountability: 'Accountability',
  culture: 'Culture',
};

// Dark-mode results email template (legacy — used by send-results type)
function buildResultsEmailHtml(results) {
  const { verdict, composite, bindingConstraint, layerScores, tasteSignature, actions } = results;

  const verdictColors = {
    Green: '#4a9c6d',
    Amber: '#722F37',
    Red: '#c75050',
  };
  const verdictColor = verdictColors[verdict] || '#722F37';

  const layerRows = Object.entries(layerScores || {})
    .map(([key, score]) => {
      const name = LAYER_NAMES[key] || key;
      const isConstraint = key === bindingConstraint;
      const barWidth = score != null ? score : 0;
      const barColor = score >= 70 ? '#4a9c6d' : score >= 40 ? '#722F37' : '#c75050';
      const constraintLabel = isConstraint ? ' <span style="color:#722F37;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;">BINDING CONSTRAINT</span>' : '';
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
    <p style="color:#722F37;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Layer Scores</p>
    <table width="100%" cellpadding="0" cellspacing="0">${layerRows}</table>
  </td></tr>

  <!-- Taste Signature -->
  <tr><td style="background:#141414;border-left:3px solid #722F37;padding:20px 24px;margin-bottom:32px;">
    <p style="color:#9a9189;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Taste Signature</p>
    <p style="color:#722F37;font-size:18px;font-weight:600;margin:0;">${tasteSignature || 'N/A'}</p>
  </td></tr>

  <!-- Spacer -->
  <tr><td style="height:32px;"></td></tr>

  <!-- Actions -->
  ${actionItems ? `
  <tr><td style="padding-bottom:32px;">
    <p style="color:#722F37;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Your Action Plan</p>
    <ul style="padding-left:20px;margin:0;">${actionItems}</ul>
  </td></tr>` : ''}

  <!-- Footer -->
  <tr><td style="border-top:1px solid #222019;padding-top:24px;">
    <p style="color:#7a756f;font-size:12px;margin:0;">The Jewell Assessment &mdash; nickjewell.ai</p>
    <p style="font-size: 13px; color: #9a9189; margin-top: 24px; padding-top: 16px; border-top: 1px solid #2a2a2a;">For ongoing analysis of AI implementation patterns, subscribe to <a href="https://nickjewellai.substack.com/subscribe" style="color: #722F37; text-decoration: none;">The Binding Constraint</a>.</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// send-results: dark-mode results email (legacy)
export async function handleSendResults(request, env, ctx, body) {
  const { email, results } = body;
  if (!email || !results) {
    return jsonResponse({ error: 'Missing email or results' }, 400);
  }

  const htmlBody = buildResultsEmailHtml(results);

  try {
    const result = await sendEmail(env, {
      from: 'Nick Jewell <nick@nickjewell.ai>',
      to: email,
      subject: `Your Jewell Assessment Results — ${results.verdict}`,
      html: htmlBody,
    });

    if (!result.ok) {
      console.error('Resend API error:', result.error);
      return jsonResponse({ error: 'Failed to send email' }, 502);
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error('Resend fetch error:', err.message);
    return jsonResponse({ error: 'Failed to send email' }, 502);
  }
}

// send-brief-email: executive brief email with score snapshot (client-side brief)
export async function handleSendBriefEmail(request, env, ctx, body) {
  const { name, email, briefHtml, verdict, bindingConstraint, compositeScore, layerScores, tasteSignature, assessmentId, naCounts } = body;
  if (!email || !briefHtml) {
    return jsonResponse({ error: 'Missing email or briefHtml' }, 400);
  }

  // Compute benchmark percentile from D1 (best-effort)
  let benchmarkPercentile = null;
  if (env.DB && layerScores) {
    try {
      let strongestKey = null;
      let maxScore = -1;
      for (const [key, score] of Object.entries(layerScores)) {
        // Suppress benchmark for layers with ANY N/A — partial-data benchmark is misleading
        if (naCounts && naCounts[key] > 0) continue;
        if (score != null && score > maxScore) {
          maxScore = score;
          strongestKey = key;
        }
      }
      if (strongestKey && maxScore >= 0) {
        const col = strongestKey + '_score';
        const belowRow = await env.DB.prepare(
          `SELECT COUNT(*) as below FROM assessment_results WHERE ${col} < ?`
        ).bind(maxScore).first();
        const totalRow = await env.DB.prepare(
          'SELECT COUNT(*) as total FROM assessment_results'
        ).first();
        if (belowRow && totalRow && totalRow.total > 0) {
          benchmarkPercentile = Math.round((belowRow.below / totalRow.total) * 100);
        }
      }
    } catch (err) {
      console.error('Benchmark percentile query failed:', err.message);
    }
  }

  const constraintName = LAYER_NAMES[bindingConstraint] || bindingConstraint || 'Unknown';
  const subject = `Your AI Readiness: ${verdict || 'Assessment'} — ${constraintName} is your binding constraint`;

  const htmlBody = buildBriefEmail({
    firstName: name ? name.split(' ')[0] : '',
    email,
    briefHtml,
    verdict,
    bindingConstraint,
    compositeScore,
    assessmentId,
    layerScores: layerScores || {},
    tasteSignature,
    benchmarkPercentile,
  });

  try {
    const result = await sendEmail(env, {
      from: 'Jewell Assessment <nick@nickjewell.ai>',
      reply_to: 'nick@nickjewell.ai',
      to: [email],
      subject,
      html: htmlBody,
      tags: [{ name: 'type', value: 'executive-brief' }],
    });

    if (!result.ok) {
      console.error('Resend API error (brief):', result.error);
      return jsonResponse({ success: false }, 502);
    }

    // Log to email_log (best-effort)
    if (env.DB) {
      try {
        await env.DB.prepare(
          'INSERT INTO email_log (assessment_id, recipient_email, recipient_name, email_type, subject, resend_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          assessmentId || null,
          email,
          name || null,
          'brief',
          subject,
          result.id || null,
          JSON.stringify({ verdict, bindingConstraint, compositeScore, tasteSignature, testMock: result.testMock || false })
        ).run();
      } catch (err) {
        console.error('Email log write failed:', err.message);
      }
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error('Resend fetch error (brief):', err.message);
    return jsonResponse({ success: false }, 502);
  }
}

// generate-and-email-brief: thin handler — validates, stores payload, sets pending.
// Actual brief generation is handled by the scheduled-brief cron Worker.
export async function handleGenerateAndEmailBrief(request, env, ctx, body) {
  const {
    assessmentId, email, briefContext,
    industryKey, sizeKey, layerScores, tasteSignature,
    tasteDimensions, bindingConstraint, constraintExplanation,
    actionPlan, benchmarkPercentile,
  } = body;

  if (!assessmentId || !email || !briefContext) {
    return jsonResponse({ error: 'Missing assessmentId, email, or briefContext' }, 400);
  }

  if (!env.DB) {
    return jsonResponse({ error: 'Database not configured' }, 500);
  }

  // COST GUARD: test emails never enter the cron queue. Runs BEFORE dedup so
  // test records can never be set to 'pending' in the first place — defense-in-
  // depth with the cron query filter in workers/scheduled-brief/index.js.
  if (email === 'test@playwright.dev' || email.endsWith('@playwright.dev') || email === 'test@example.com') {
    try {
      await env.DB.prepare(
        'UPDATE assessment_results SET brief_email_status = ? WHERE id = ?'
      ).bind('test_mock', assessmentId).run();
    } catch (err) {
      console.error('Test mock status update failed:', err.message);
    }
    return jsonResponse({ data: { status: 'test-skipped' } }, 200);
  }

  // Deduplication check
  try {
    const row = await env.DB.prepare(
      'SELECT brief_email_status FROM assessment_results WHERE id = ?'
    ).bind(assessmentId).first();

    if (row && (row.brief_email_status === 'sent' || row.brief_email_status === 'pending' || row.brief_email_status === 'test_mock')) {
      return jsonResponse({ data: { status: 'already-processing' } }, 200);
    }
  } catch (err) {
    console.error('Dedup check failed:', err.message);
  }

  // Store payload and set pending — cron Worker picks this up
  const requestPayload = JSON.stringify({
    briefContext, industryKey, sizeKey, layerScores,
    tasteSignature, tasteDimensions, bindingConstraint,
    constraintExplanation, actionPlan, benchmarkPercentile,
  });

  try {
    await env.DB.prepare(
      'UPDATE assessment_results SET brief_email_status = ?, brief_request_payload = ? WHERE id = ?'
    ).bind('pending', requestPayload, assessmentId).run();
  } catch (err) {
    console.error('Set pending + payload failed:', err.message);
    return jsonResponse({ error: 'Failed to queue brief generation' }, 500);
  }

  return jsonResponse({ data: { status: 'accepted' } }, 202);
}

