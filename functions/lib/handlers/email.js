// Handlers for email operations — send-results, send-brief-email, generate-and-email-brief

import { buildBriefEmail } from '../email-templates.js';
import { buildSystemPrompt } from '../brief-prompts.js';
import { checkIpLimit, checkBriefCap } from '../middleware/rate-limit.js';
import { jsonResponse } from '../middleware/responses.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

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

const TEST_BRIEF_MARKDOWN = `## Verdict Context

Your organization scored in the Amber range, which means the building blocks for AI adoption exist but critical gaps remain. Given your industry and maturity stage, this is a common — and fixable — position.

## The Real Story

The pattern across your answers reveals an organization that understands the potential of AI but hasn't yet built the operational infrastructure to capture that potential reliably. Your strongest layers show genuine strategic thinking, but the gap in your binding constraint is creating a bottleneck that limits everything downstream.

## Taste Read

Your Taste signature reveals a decision-making style that balances pragmatism with analytical rigor. Your frame recognition and kill discipline scores suggest you can identify the right problems to solve — but edge case handling indicates you may underweight implementation risks when momentum is high.

## The Binding Constraint

Your weakest layer is acting as a structural bottleneck. Until this is addressed, investments in other layers will deliver diminishing returns. The failure mode here is predictable: initiatives launch with enthusiasm, hit the constraint wall, and stall — creating organizational scar tissue that makes the next attempt harder.

## What To Do Monday

- **Audit your constraint layer this week** — map every process that touches your binding constraint and identify the three highest-friction points. You likely already know what they are.
- **Assign a single owner for AI governance** — the gap between your strongest and weakest layers suggests distributed responsibility with no clear accountability. One person, one mandate, one quarterly review.
- **Kill one active initiative that isn't working** — your scores suggest you're spreading effort across too many fronts. Pick the one with the worst ratio of investment to outcome and redirect those resources to your constraint.`;

// Dark-mode results email template (legacy — used by send-results type)
function buildResultsEmailHtml(results) {
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

// Convert markdown brief text to basic HTML for email
function markdownToHtml(text) {
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      if (inList) { html += '</ul>'; inList = false; }
      const level = headingMatch[1].length;
      const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
      html += `<${tag}>${headingMatch[2]}</${tag}>`;
      continue;
    }

    // Bullets
    if (/^\s*[-*]\s+/.test(trimmed)) {
      if (!inList) { html += '<ul>'; inList = true; }
      const content = trimmed.replace(/^\s*[-*]\s+/, '');
      html += `<li>${inlineBold(content)}</li>`;
      continue;
    }

    // Paragraph
    if (inList) { html += '</ul>'; inList = false; }
    html += `<p>${inlineBold(trimmed)}</p>`;
  }

  if (inList) html += '</ul>';
  return html;
}

function inlineBold(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
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
  const { name, email, briefHtml, verdict, bindingConstraint, compositeScore, layerScores, tasteSignature, assessmentId } = body;
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

// generate-and-email-brief: server-side brief generation via waitUntil()
// Synchronous: validate, dedup, set pending, return 202
// Async (waitUntil): generate brief via Opus, email via Resend, update D1
export async function handleGenerateAndEmailBrief(request, env, ctx, body) {
  const {
    assessmentId, name, email, briefContext,
    industryKey, sizeKey, verdict, compositeScore,
    layerScores, tasteSignature, bindingConstraint,
    constraintExplanation, actionPlan, benchmarkPercentile,
  } = body;

  // Validate required fields
  if (!assessmentId || !email || !briefContext) {
    return jsonResponse({ error: 'Missing assessmentId, email, or briefContext' }, 400);
  }

  // Rate limiting
  if (env.DB) {
    const url = new URL(request.url);
    const adminKey = url.searchParams.get('admin_key');
    const isAdmin = adminKey && env.ADMIN_KEY && adminKey === env.ADMIN_KEY;

    if (!isAdmin) {
      const clientIp = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

      try {
        const ipResponse = await checkIpLimit(env.DB, clientIp);
        if (ipResponse) return ipResponse;
      } catch (err) {
        console.error('D1 per-IP rate limit check failed:', err.message);
      }

      try {
        const capResponse = await checkBriefCap(env.DB);
        if (capResponse) return capResponse;
      } catch (err) {
        console.error('D1 global daily cap check failed:', err.message);
      }
    }
  }

  // Deduplication check
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        'SELECT brief_email_status FROM assessment_results WHERE id = ?'
      ).bind(assessmentId).first();

      if (row && (row.brief_email_status === 'sent' || row.brief_email_status === 'pending')) {
        return jsonResponse({ data: { status: 'already-processing' } }, 200);
      }
    } catch (err) {
      console.error('Dedup check failed:', err.message);
    }

    // Set pending status
    try {
      await env.DB.prepare(
        'UPDATE assessment_results SET brief_email_status = ? WHERE id = ?'
      ).bind('pending', assessmentId).run();
    } catch (err) {
      console.error('Set pending status failed:', err.message);
    }
  }

  // Return 202 immediately — brief generation happens in waitUntil()
  const asyncPayload = {
    assessmentId, name, email, briefContext,
    industryKey, sizeKey, verdict, compositeScore,
    layerScores, tasteSignature, bindingConstraint,
    constraintExplanation, actionPlan, benchmarkPercentile,
  };

  ctx.waitUntil(generateBriefAndEmail(env, asyncPayload));

  return jsonResponse({ data: { status: 'accepted' } }, 202);
}

// Async background work — runs inside waitUntil()
async function generateBriefAndEmail(env, payload) {
  const {
    assessmentId, name, email, briefContext,
    industryKey, sizeKey, verdict, compositeScore,
    layerScores, tasteSignature, bindingConstraint,
    constraintExplanation, actionPlan, benchmarkPercentile,
  } = payload;

  try {
    console.log(`[brief:${assessmentId}] waitUntil started — email=${email}, testMode=${env.TEST_MODE === 'true'}`);

    let briefMarkdown;

    // TEST_MODE: return canned brief instead of calling Anthropic
    if (env.TEST_MODE === 'true' || env.TEST_MODE === true) {
      console.log(`[brief:${assessmentId}] TEST_MODE — using canned brief`);
      briefMarkdown = TEST_BRIEF_MARKDOWN;
    } else {
      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

      const systemPrompt = buildSystemPrompt(industryKey, sizeKey);

      console.log(`[brief:${assessmentId}] calling Anthropic API...`);
      const anthropicRes = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: briefContext }],
        }),
      });
      console.log(`[brief:${assessmentId}] Anthropic responded — status=${anthropicRes.status}`);

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        throw new Error(`Anthropic API ${anthropicRes.status}: ${errText}`);
      }

      const anthropicData = await anthropicRes.json();
      briefMarkdown = anthropicData.content?.[0]?.text;
      if (!briefMarkdown) throw new Error('Empty response from Anthropic');
      console.log(`[brief:${assessmentId}] Anthropic brief received — ${briefMarkdown.length} chars`);
    }

    // Convert markdown to HTML for the email
    const briefHtml = markdownToHtml(briefMarkdown);
    console.log(`[brief:${assessmentId}] markdown converted to HTML — ${briefHtml.length} chars`);

    // Compute benchmark percentile from D1 (best-effort)
    let computedPercentile = benchmarkPercentile;
    if (computedPercentile == null && env.DB && layerScores) {
      try {
        let strongestKey = null;
        let maxScore = -1;
        for (const [key, score] of Object.entries(layerScores)) {
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
            computedPercentile = Math.round((belowRow.below / totalRow.total) * 100);
          }
        }
      } catch (err) {
        console.error(`[brief:${assessmentId}] benchmark percentile query failed:`, err.message);
      }
    }

    const constraintName = LAYER_NAMES[bindingConstraint] || bindingConstraint || 'Unknown';
    const tasteSignatureName = tasteSignature && typeof tasteSignature === 'object'
      ? tasteSignature.name
      : tasteSignature;
    const subject = `Your AI Readiness: ${verdict || 'Assessment'} — ${constraintName} is your binding constraint`;

    const emailHtml = buildBriefEmail({
      firstName: name ? name.split(' ')[0] : '',
      email,
      briefHtml,
      verdict,
      bindingConstraint,
      compositeScore,
      layerScores: layerScores || {},
      tasteSignature: tasteSignatureName,
      benchmarkPercentile: computedPercentile,
    });

    // Send via Resend (or mock in TEST_MODE)
    console.log(`[brief:${assessmentId}] sending email via Resend...`);
    const emailResult = await sendEmail(env, {
      from: 'Jewell Assessment <nick@nickjewell.ai>',
      reply_to: 'nick@nickjewell.ai',
      to: [email],
      subject,
      html: emailHtml,
      tags: [{ name: 'type', value: 'executive-brief' }],
    });
    console.log(`[brief:${assessmentId}] sendEmail result — ok=${emailResult.ok}, id=${emailResult.id}, testMock=${emailResult.testMock || false}`);

    if (!emailResult.ok) {
      throw new Error(emailResult.error);
    }

    const emailStatus = emailResult.testMock ? 'test_mock' : 'sent';

    // Success — update D1
    if (env.DB) {
      console.log(`[brief:${assessmentId}] updating D1 — brief_email_status=${emailStatus}`);
      try {
        await env.DB.prepare(
          'UPDATE assessment_results SET brief_email_status = ? WHERE id = ?'
        ).bind(emailStatus, assessmentId).run();
        console.log(`[brief:${assessmentId}] D1 status update succeeded`);
      } catch (err) {
        console.error(`[brief:${assessmentId}] D1 status update failed:`, err.message);
      }

      console.log(`[brief:${assessmentId}] writing email_log...`);
      try {
        await env.DB.prepare(
          'INSERT INTO email_log (assessment_id, recipient_email, recipient_name, email_type, subject, resend_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          assessmentId,
          email,
          name || null,
          'brief',
          subject,
          emailResult.id || null,
          JSON.stringify({ verdict, bindingConstraint, compositeScore, tasteSignature: tasteSignatureName, testMock: emailResult.testMock || false })
        ).run();
        console.log(`[brief:${assessmentId}] email_log write succeeded`);
      } catch (err) {
        console.error(`[brief:${assessmentId}] email_log write failed:`, err.message);
      }
    }

    console.log(`[brief:${assessmentId}] waitUntil completed successfully`);
  } catch (err) {
    console.error(`[brief:${assessmentId}] FATAL — waitUntil failed:`, err.message, err.stack);

    // First priority: mark as failed in D1
    if (env.DB) {
      try {
        await env.DB.prepare(
          'UPDATE assessment_results SET brief_email_status = ? WHERE id = ?'
        ).bind('failed', assessmentId).run();
        console.log(`[brief:${assessmentId}] marked as failed in D1`);
      } catch (dbErr) {
        console.error(`[brief:${assessmentId}] COULD NOT mark as failed in D1:`, dbErr.message);
      }

      try {
        await env.DB.prepare(
          'INSERT INTO email_log (assessment_id, recipient_email, recipient_name, email_type, subject, resend_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          assessmentId,
          email,
          name || null,
          'brief',
          'FAILED',
          null,
          JSON.stringify({ error: err.message, stack: err.stack })
        ).run();
      } catch (logErr) {
        console.error(`[brief:${assessmentId}] email_log error write also failed:`, logErr.message);
      }
    }
  }
}
